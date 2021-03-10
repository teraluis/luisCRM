// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import "cypress-localstorage-commands";
import jwt_decode from "jwt-decode";

Cypress.Commands.add('login', () => {
  cy.request({
    method: 'POST',
    url: 'https://api.int.adx-groupe.com/protected/token',
    body: {
      username: 'adxcalypso@allodiag.fr',
      password: 'kqPFY!q6@<zN',
    }
  })
    .its('body')
    .then(body => {
      cy.setLocalStorage('locale', 'en');
      const tokenInfo = jwt_decode(body.token);
      const expiration = tokenInfo.expiration * 1000;
      cy.setLocalStorage('expiration', expiration.toString());
      cy.setLocalStorage('username', 'adxcalypso@allodiag.fr');
      cy.setLocalStorage("token", body.token);
      cy.setLocalStorage("organization", '{"uuid":"877609b8-6a0f-4bde-8787-ecab48341416","name":"ADX"}');
      cy.setLocalStorage("marketuuid", 'market-ae1dca5a-97ef-4345-a91e-fba4c86e4bb9');
      cy.setLocalStorage('privileges', '["accounts","activites","add_report","calypso","client_validation","consultation_intervention","dashboard","developer","devis","estates","facturation","groupes","interventions","management","marches","mission","operations","read_zip_sha","report_status","buttonValidationCompte","referentiels","orders","manage_gateways","read_gateways","run_stop_gateways","read_roles","manage_roles","manage_privileges","read_users","read_privileges","manage_users","read_security_keys","manage_security_keys","read_authentications","manage_authentications","read_resources","manage_resources","read_parameters","manage_parameters","read_organizations","manage_organizations","accounts_pro","agences","admin"]')
    })
});

Cypress.Commands.add('randText', (length) => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  for (let i = length; i--;)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
})
