const intUrl = 'https://api.int.adx-groupe.com';
const mis = 'http://localhost:6010';
const crm = 'http://localhost:6011';
const rep = 'http://localhost:6012';
const est = 'http://localhost:6013';

export const environment = {
  orbitUrl: intUrl,
  production: false,
  environment: {
    value: 'local',
    color: '#0a7a44'
  },
  // missionsUrl: intUrl,
  // crmUrl: intUrl,
  // reportsUrl: intUrl,
  // estatesUrl: intUrl
  missionsUrl: mis,
  crmUrl: crm,
  reportsUrl: rep,
  estatesUrl: est
};
