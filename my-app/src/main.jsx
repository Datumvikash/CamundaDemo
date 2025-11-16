import React from 'react'
import ReactDOM from 'react-dom/client'
import { ReactKeycloakProvider } from '@react-keycloak/web'
import keycloak from './keycloak'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
 <ReactKeycloakProvider
  authClient={keycloak}
  initOptions={{
  onLoad: 'check-sso',
    checkLoginIframe: false
  }}
  onEvent={(event, error) => {
    console.log("Keycloak event:", event, error)
  }}
  onTokens={(tokens) => {
    console.log("Keycloak tokens:", tokens)
  }}
>
  <App />
</ReactKeycloakProvider>
)
