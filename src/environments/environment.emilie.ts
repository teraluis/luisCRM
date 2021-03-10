const intUrl = 'https://api.int.adx-groupe.com';
const mis = 'http://localhost:9001';
const crm = 'http://localhost:9000';
const rep = 'http://localhost:9000';
const est = 'http://localhost:9004';

export const environment = {
  orbitUrl: intUrl,
  production: false,
  environment: {
    value: 'local',
    color: '#0a7a44'
  },

  // crmUrl: intUrl,
  reportsUrl: intUrl,
  // estatesUrl: intUrl,
  missionsUrl: intUrl,
  crmUrl: crm,
  // reportsUrl: rep,
  estatesUrl: intUrl
};
