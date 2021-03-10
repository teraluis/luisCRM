// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.int.ts`.
// The list of file replacements can be found in `angular.json`.
const intUrl = 'https://api.int.adx-groupe.com';

const orbit = 'http://localhost:9000';
const crm = 'http://localhost:9002';
const mission = 'http://localhost:9003';
const estates = 'http://localhost:9006';

export const environment = {
  orbitUrl: intUrl,
  crmUrl: intUrl,
  estatesUrl: intUrl,
  missionsUrl: intUrl,
  production: false,
  environment: {
    value: 'local',
    color: '#0a7a44'
  }
};
