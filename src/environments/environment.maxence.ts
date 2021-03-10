const intUrl = 'https://api.int.adx-groupe.com';
const mis = 'http://localhost:9001';
const crm = 'http://localhost:9002';
const rep = 'http://localhost:9003';
const est = 'http://localhost:9004';

export const environment = {
  orbitUrl: intUrl,
  production: false,
  environment: {
    value: 'local',
    color: '#0a7a44'
  },
  missionsUrl: intUrl,
  crmUrl: intUrl,
  reportsUrl: intUrl,
  estatesUrl: intUrl,
  // missionsUrl: mis,
  // crmUrl: crm,
  // reportsUrl: rep,
  // estatesUrl: est
};
