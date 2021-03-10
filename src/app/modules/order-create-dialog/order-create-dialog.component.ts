import {forkJoin, of, Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {Account, AccountsService} from '../../services/backend/accounts.service';
import {Component, OnInit} from '@angular/core';
import {IMarket, MarketsService, MarketUserRole} from '../../services/backend/markets.service';
import {Inject} from '@angular/core';
import {CommercialService} from '../../services/backend/commercial.service';
import {Order, OrdersService} from '../../services/backend/orders.service';
import {Router} from '@angular/router';
import {MatDialogRef} from '@angular/material';
import {
  EstablishmentsService, FullEstablishment
} from '../../services/backend/establishments.service';
import {IUser, User, UsersService} from '../../services/backend/users.service';
import {AddressUtils} from '../utils/address-utils';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {PeopleUtils} from '../utils/people-utils';
import {People, PeopleService, PeopleWithOrigin} from '../../services/backend/people.service';
import {OrderStatusLabel} from '../utils/order-utils';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-order-create-dialog',
  templateUrl: './order-create-dialog.component.html',
  styleUrls: ['./order-create-dialog.component.scss']
})
export class OrderCreateDialogComponent implements OnInit {

  orderForm: FormGroup;
  // Current data
  account: Account;
  selectedEstablishment: FullEstablishment;
  selectedCommercial: IUser;
  selectedMarket: IMarket;
  selectedPurchaserContact: People;
  // Suggested lists+
  possibleEstablishments: FullEstablishment[];
  suggestedCommercials: User[] = [];
  suggestedMarkets: IMarket[] = [];
  suggestedContacts: PeopleWithOrigin[] = [];
  // Component
  address: string;
  marketName: string;
  purchaserName: string;
  commercialName: string;
  nameFound = new Subject<string>();
  search: FormControl;
  loading = false;
  saving = false;
  marketLoading = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: OrderCreateData,
              public dialogRef: MatDialogRef<OrderCreateDialogComponent>,
              private marketsService: MarketsService,
              private commercialService: CommercialService,
              private accountsService: AccountsService,
              private establishmentsService: EstablishmentsService,
              private usersService: UsersService,
              private peopleService: PeopleService,
              private ordersService: OrdersService,
              private router: Router,
              private fb: FormBuilder) {
  }

  ngOnInit() {
    this.orderForm = this.fb.group({
      establishment: [{value: '', disabled: false}, Validators.required],
      address: [{value: '', disabled: true}, Validators.required],
      market: [{value: '', disabled: false}, [Validators.required]],
      commercial: [{value: '', disabled: false}, [Validators.required]],
      purchaserContact: [{value: '', disabled: true}, [Validators.required]],
    });

    this.search = new FormControl({value: this.commercialName, disabled: false});
    this.search.valueChanges.pipe(debounceTime(300))
      .subscribe(res => this.searchCommercial(res));
    if (this.data && this.data.defaultEstablishment) {
      this.orderForm.get('establishment').setValue(this.data.defaultEstablishment.establishment.name);
      this.selectEstablishment(this.data.defaultEstablishment);
    }
  }

  suggestEstablishment() {
    of(this.orderForm.getRawValue().establishment).pipe(debounceTime(300)).subscribe((search) => {
      if (search) {
        this.establishmentsService.searchForOrder(search)
          .subscribe((establishments) => this.possibleEstablishments = establishments);
      }
    });
  }

  suggestCommercial() {
    of(this.orderForm.getRawValue().commercial).pipe(debounceTime(300)).subscribe((search) => {
      if (search) {
        this.searchCommercial(search);
      }
    });
  }

  searchCommercial(text: string) {
    if (text && text.length > 1) {
      this.usersService.searchUser(text).subscribe((results) => {
        this.suggestedCommercials = results.map(user => User.fromData(user));
        this.suggestedCommercials = this.suggestedCommercials.filter(c => !!c.registration_number);
      });
    } else {
      this.suggestedCommercials = [];
    }
  }

  selectEstablishment(full: FullEstablishment) {
    this.clear();
    this.selectedEstablishment = full;
    if (this.selectedEstablishment) {
      this.orderForm.get('purchaserContact').enable();
      this.orderForm.get('commercial').setValue(null);
      this.orderForm.get('purchaserContact').setValue(null);
      this.orderForm.get('market').setValue(null);

      this.loading = true;
      forkJoin(
        this.accountsService.getFromEntity(full.establishment.entity),
        this.marketsService.getAllFromEstablishment(full.establishment.uuid),
        this.peopleService.getPurchasers(full.establishment.uuid, this.selectedMarket ? this.selectedMarket.uuid : null)
      ).subscribe(([account, markets, contacts]) => {
        this.account = account;
        this.address = AddressUtils.getFullName(full.addresses[0].address);
        this.suggestedMarkets = markets ? markets : [];
        this.suggestedContacts = contacts;

        this.orderForm.get('address').setValue(AddressUtils.getFullName(full.addresses[0].address));
        setTimeout(() => this.loading = false);
      });
    }
  }

  onMarketSelected() {
    this.selectedMarket = this.orderForm.get('market').value;
    if (this.selectedMarket && this.selectedMarket.uuid) {
      this.marketLoading = true;
      this.orderForm.get('commercial').setValue(null);
      this.orderForm.get('purchaserContact').setValue(null);

      this.marketsService.getUser(this.selectedMarket.uuid).subscribe(users => {
        users.forEach(user => {
          if (user.role === MarketUserRole.COMMERCIAL) {
            this.orderForm.get('commercial').setValue(User.fromData(user.user));
          }
        });
        this.peopleService.getPurchasers(this.selectedEstablishment.establishment.uuid, this.selectedMarket.uuid).subscribe((contacts) => {
          this.suggestedContacts = contacts;
          this.marketLoading = false;
        });
      });
    } else {
      this.marketLoading = true;
      this.orderForm.get('commercial').setValue(null);
      this.orderForm.get('purchaserContact').setValue(null);

      this.peopleService.getPurchasers(this.selectedEstablishment.establishment.uuid, null).subscribe((contacts) => {
        this.suggestedContacts = contacts;
        this.marketLoading = false;
      });
    }
  }

  save() {
    this.saving = true;
    this.nameFound.asObservable().subscribe((orderName) => {
      this.selectedMarket = this.orderForm.get('market').value;
      this.selectedPurchaserContact = this.orderForm.get('purchaserContact').value;
      this.selectedCommercial = this.orderForm.get('commercial').value;

      const newOrder: Order = {
        uuid: null,
        name: orderName,
        account: this.account,
        purchaserContact: this.selectedPurchaserContact,
        establishment: this.selectedEstablishment,
        market: this.selectedMarket,
        commercial: this.selectedCommercial,
        status: OrderStatusLabel.RECEIVED,
        // Unused for creation
        reportDestinations: [],
        orderLines: [],
        attachment: null,
        created: null
      };
      this.ordersService.add(newOrder).subscribe((orderUuid) => {
        if (!orderUuid || !orderUuid.uuid) {
          console.log('Failed to add order for account ' + this.account.uuid);
        } else {
          this.router.navigate(['/orders/' + orderUuid.uuid]);
        }
        setTimeout(() => this.saving = false);
        this.dialogRef.close();
      });
    });
    this.generateName();
  }

  private generateName() {
    let name = 'C';
    for (let i = 0; i < 7; i++) {
      const rand = Math.floor(Math.random() * 10);
      name = name + rand.toString();
    }
    return this.ordersService.getWithName(name).subscribe((uuid) => {
      if (uuid.uuid === '') {
        this.nameFound.next(name);
      } else {
        this.generateName();
      }
    });
  }

  isComplete() {
    return this.account && this.selectedCommercial && this.selectedCommercial.login
      && this.selectedEstablishment && this.selectedMarket && this.selectedPurchaserContact;
  }

  clear() {
    this.account = null;
    this.address = null;
    this.commercialName = null;
    this.marketName = null;
    this.purchaserName = null;
    this.selectedCommercial = null;
    this.selectedMarket = null;
    this.selectedPurchaserContact = null;
    this.suggestedCommercials = [];
    this.suggestedMarkets = [];
    this.suggestedContacts = [];
  }

  getContactName(contact: PeopleWithOrigin) {
    return PeopleUtils.getName(contact.people);
  }
}

export interface OrderCreateData {
  defaultEstablishment?: FullEstablishment; // Default establishment
}
