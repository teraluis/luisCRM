import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/internal/operators';
import {environment} from '../../../environments/environment';
import {RequestUtilities, UtilitiesService} from './utilities.service';
import {map} from "rxjs/operators";

@Injectable({providedIn: 'root'})
export class UsersService {
  // @ts-ignore
  baseUrl = environment.crmUrl || environment.orbitUrl;
  utilities: RequestUtilities;

  constructor(private httpClient: HttpClient, private utilitiesService: UtilitiesService) {
    this.utilities = this.utilitiesService.getUtilities();
  }

  searchUser(value: string): Observable<IUser[]> {
    return this.httpClient.get<IUser[]>(`${this.baseUrl}/v1/${this.utilities.organizationName}/users/search-users/${value}`, {
      headers: this.utilities.headers
    }).pipe(catchError((error: HttpErrorResponse) => this.catchError(error)));
  }

  get(uuid: string): Observable<IUser> {
    const utilities = this.utilitiesService.getUtilities();
    return this.httpClient.get<IUser>(this.baseUrl + '/v1/' + utilities.organizationName + '/users/' + uuid, {
      headers: utilities.headers
    }).pipe(map(
      (resp) => {
        return resp;
      }), catchError((error: HttpErrorResponse) => {
        this.utilitiesService.handleError(error);
        return of(null);
      }
    ));
  }

  private catchError(error: HttpErrorResponse) {
    this.utilitiesService.handleError(error);
    return of(null);
  }
}

export interface IUser {
  login: string;
  registration_number?: string;
  first_name: string;
  last_name: string;
  office?: string;
  phone?: string;
  description: string;

  toString(): string;
}

export class User implements IUser {
  constructor(
    public login: string,
    public first_name: string,
    public last_name: string,
    public description: string,
    public registration_number?: string,
    public office?: string,
    public phone?: string,
  ) {
  }

  static fromData(data: IUser): User {
    const { login, first_name, last_name, description, registration_number, office, phone } = data;
    return new this(
      login, first_name, last_name, description, registration_number, office, phone
    );
  }

  toString = (): string => {
    return `${this.last_name} ${this.first_name}`;
  }

  static buildUserWithRole(user: IUser, role?: string): UserWithRole {
    return {
      user: user,
      role: role
    };
  }
}

export interface UserWithRole {
  user: User;
  role?: string;
}
