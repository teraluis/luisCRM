import 'cypress-file-upload';

context('Order', () => {
  before(() => {
    cy.login();
    cy.saveLocalStorage();
  });
  beforeEach(() => {
    cy.restoreLocalStorage();
    cy.visit('http://localhost:4200/#/orders')
  });

  it('Should create an order', () => {
    cy.get('.big-fixed-button > .mat-button-wrapper > .mat-icon').click();
    cy.get('.fixed-button > .mat-button-wrapper > .mat-icon').click();

    cy.server();
    cy.route('POST', '**/v1/ADX/attachments').as('upload');
    cy.route('GET', '**/v1/ADX/orders/**').as('order');
    cy.route('POST', '**/v1/ADX/interventions/ground').as('ground');
    cy.route('GET', '**/v1/ADX/establishments?suggestfororder=**').as('suggest');

    // Popup
    cy.get('[data-cy=client]').type('la c');
    cy.wait('@suggest').then(() => {
      cy.wait(1000);
      cy.get('[data-cy=clientsuggestions]').not('.disabled').first().click();
    });
    cy.get('[data-cy=market]').click();
    cy.get('[data-cy=marketsuggestions]').first().click();
    cy.get('[data-cy=commercial]').invoke('val').should('not.be.empty');
    cy.get('[data-cy=purchaser]').click();
    cy.get('[data-cy=purchasersuggestions]').first().click();
    cy.get('[data-cy=validate]').click();

    cy.wait('@order').should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    });

    // upload file
    cy.get('.right-column mat-tab-group>mat-tab-header .mat-tab-label-container .mat-tab-labels>div', {timeout: 10000}).eq(1).click();

    cy.fixture('sleepy.gif').then(file => {
      cy.get('input[type="file"]').attachFile({
        fileContent: file.toString(),
        fileName: 'sleepy.gif',
        mimeType: 'image/gif'
      })
      cy.get('mat-icon').contains('add_circle_outline').click();
    })
    cy.wait('@upload').should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })

    // Description tab
    cy.get('#mat-tab-label-0-1').click();

    // order form
    cy.get('mat-form-field').eq(0).type(randText(10));
    cy.get('mat-form-field').eq(4).find('button').click()
    cy.get('mat-calendar').find('.mat-calendar-body-today').click();

    cy.get('button[color="primary"]').eq(0).click()
    cy.wait('@upload').should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })

    // create estate
    cy.get('.fixed-div mat-icon').contains('add').click();
    cy.get('.fixed-div div').contains('Bien').click();
    cy.get('input[placeholder="Adresse ou référence..."]').type('aaa');
    cy.get('button[mattooltip="Rechercher"]').click();
    cy.get('button[mattooltip="Créer un bien"]').click();

    // popup
    cy.route('GET', '**/v1/ADX/locations**').as('location')
    cy.route('POST', '**/v1/ADX/estates').as('estate')
    cy.get('app-estate-create .mat-select-arrow-wrapper').first().click()
    cy.get('.mat-option').first().click();
    cy.get('button').contains('Suivant').click();
    cy.get('app-address-create mat-form-field').first().type('123 rue')
    cy.wait('@location').should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })
    cy.get('.mat-option').first().click();
    cy.get('button').contains('Enregistrer').click();

    cy.wait('@estate').should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })
    cy.get('app-estate-edit-dialog mat-icon').contains('add_shopping_cart').first().click();
    cy.get('button').contains('Valider').click();

    // estate tab
    cy.route('GET', '**/v1/ADX/estateWithPrestations**').as('estateWithPrestations')
    cy.get('.mat-tab-label-content', {timeout: 10000}).contains('Biens').click();
    cy.wait('@estateWithPrestations', {timeout: 20000}).should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })
    cy.wait(2000);
    cy.get('mat-checkbox', {timeout: 10000}).eq(1).click()
    cy.get('.fixed-div mat-icon').contains('add').click();
    cy.get('.fixed-div div').contains('Prestation').click();

    // add prestation
    cy.get('app-orderprestation mat-select').first().click();
    cy.get('.mat-option').eq(1).click();
    cy.get('.mat-option').eq(4).click();
    cy.get('body').type('{esc}', {force: true})
    cy.get('.mat-select-panel').should('not.exist')

    cy.get('tbody > :nth-child(2) > :nth-child(4)').type('Test DPE')
    cy.get('tbody > :nth-child(2) > :nth-child(5)').type('321.12')
    cy.get('tbody > :nth-child(3) > :nth-child(4)').type('Test Plomb')
    cy.get('tbody > :nth-child(3) > :nth-child(5)').type('123.32')

    cy.route('PATCH', '**/v1/ADX/orders/**').as('patchOrder')
    cy.get('button').contains('Enregistrer 1/1').click();
    cy.wait('@patchOrder', {timeout: 20000}).should((xhr) => {
      expect(xhr.status, 'successful PATCH').to.equal(200)
    })
    cy.get('body').type('{esc}', {force: true})

    // validate order
    cy.get('.right-column mat-tab-group>mat-tab-header .mat-tab-label-container .mat-tab-labels>div', {timeout: 10000}).eq(0).click();
    cy.get('.right-column button').contains('Confirmer les informations').click();
    cy.get('app-confirmation button').contains('Confirmer').click();

    // Intervention
    cy.wait(['@ground', '@patchOrder', '@estateWithPrestations', '@order'], {timeout: 20000})
      .should((xhr) => {
        xhr.forEach(x => expect(x.status, 'successful GET').to.equal(200));
      })
    cy.route('GET', '**/v1/ADX/orders/**/interventions**').as('interventions')
    cy.get('.mat-tab-label-content', {timeout: 10000}).contains('Interventions').click();
    cy.wait('@interventions', {timeout: 20000}).should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })
    cy.route('GET', '**/v1/ADX/interventions/**').as('intervention')
    cy.get('mat-icon').contains('chevron_right').click()
    cy.wait('@intervention', {timeout: 20000}).should((xhr) => {
      expect(xhr.status, 'successful GET').to.equal(200)
    })
    cy.get('mat-select').first().click();
    cy.get('mat-option').first().click();
    cy.route('POST', '**/v1/ADX/interventions/**/parameters').as('parameters')
    cy.get('button').contains('Enregistrer').first().click();
    cy.wait('@parameters', {timeout: 20000}).should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })

    // scheduler
    cy.get('button').contains('Plannifier').click();
    cy.get('app-intervention-schedule mat-datepicker-toggle').click();
    cy.get('mat-calendar').find('.mat-calendar-body-today').click();
    cy.get('app-intervention-schedule mat-form-field').eq(1).click();
    cy.get('.timepicker button').contains('Ok').click()
    cy.get('.timepicker').should('not.exist')
    cy.get('app-intervention-schedule mat-form-field').eq(2).find('input').clear();
    cy.get('app-intervention-schedule mat-form-field').eq(2).type('1');
    cy.get('app-intervention-schedule mat-form-field').eq(3).type('neymar');
    cy.get('app-intervention-schedule mat-form-field').eq(4).type('jean');
    cy.get('app-intervention-schedule mat-form-field').eq(5).type('jean.naymar@aol.fr');
    cy.get('app-intervention-schedule button').contains('Enregistrer').click();
  })
})

function randText(length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (let i = length; i--;)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
