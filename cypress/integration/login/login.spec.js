context('Login', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/#/login')
  })

  it('Empty login', () => {
    cy.get('.mat-raised-button').click();
    cy.get('.mat-snack-bar-container').should('have.text', ' Veuillez entrer vos identifiants. ')
  })

  it('Failed to login', () => {
    cy.get('input[placeholder="Identifiant"]').type('test');
    cy.get('input[placeholder="Mot de passe"]').type('machin');
    cy.server();
    cy.route('POST', 'https://api.int.adx-groupe.com/protected/token').as('loginResponse')
    cy.get('.mat-raised-button').click();

    cy.wait('@loginResponse').should((xhr) => {
      expect(xhr.status, 'failed POST').to.equal(401)
    })
    cy.get('@loginResponse').its('response').then((res) => {
      expect(res.body, 'response body').to.deep.equal({
        error: 'Invalid credentials.'
      })
    })
  })

  it('Success to login', () => {
    cy.get('input[placeholder="Identifiant"]').type('adxcalypso@allodiag.fr');
    cy.get('input[placeholder="Mot de passe"]').type('kqPFY!q6@<zN');
    cy.server();
    cy.route('POST', 'https://api.int.adx-groupe.com/protected/token').as('loginResponse')
    cy.get('.mat-raised-button').click();

    cy.wait('@loginResponse').should((xhr) => {
      expect(xhr.status, 'successful POST').to.equal(200)
    })
  })
})
