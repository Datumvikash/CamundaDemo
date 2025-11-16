import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://63.178.79.202:18080/auth', // Camunda Keycloak URL
  realm: 'camunda-platform',
  clientId: 'react-app',
});


export default keycloak;
