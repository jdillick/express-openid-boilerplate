# OpenId Connect SSO Express.js Boilerplate

This project demonstrates a simple node.js/express server that is setup with session middleware for
generic OpenId Connect authentication (IBM oidc by default).

## Environment Setup

Environment variables the boilerplate uses to run by default:

- **ENV_CREDENTIALS_MODULE_FILE**: Full path to node module specifying credentials. See Credentials section below.
- **HTTP_PORT_VAR**: The environment variable used to obtain the plain-text port for the server.
- **HTTPS_PORT_VAR**: The environment variable used to obtain the TLS/SSL port for the server.
- **HTTPS_KEY_FILE**: The full path to the OpenSSL key (PEM) file.
- **HTTPS_CERT_FILE**: The full path the OpenSSL certificate (PEM) file.
- **HTTPS_PASSPHRASE**: The passphrase for the OpenSSL key.
- **SSO_AUTH_REDIRECT_URL**: The FQDN URL to provide to OpenId Connect (in you application), that will handle the return callback after authentication. (e.g. https://localhost:3333/auth for local or https://myapp.example.com/auth for production)
- **OPENID_ISSUER_URI**: The issuer URL endpoint for your OpenId connect service.
- **OPENID_AUTHORIZATION_URI**: The authorization URL endpoint for your OpenId connect service.
- **OPENID_TOKEN_URI**: The token URL endpoint for your OpenId connect service.
- **USERINFO_URI**: The user info URL endpoint for your OpenId connect service.
- **OPENID_JWKS_URI**: The JSON Web Token Keystore URL endpoint for your OpenId connect service.

## JWKS_URI IBM
IBM does not serve JWKs in their implementation, so you will need to do this yourself. See src/auth/index.js for more details.

## Credentials
The server expects a `env.js` node module to be present in the base directory of this repository, or a server readable path to a node module specified by environment variable `ENV_CREDENTIALS_MODULE_FILE`.

This file should like something like:

``` js
module.exports = {
    ssoClientId: '<your openid client id>',
    ssoClientSecret: '<your openid client secret>',
    dbHost: '<mysql host>',
    dbPort: '<mysql port>',
    dbName: '<database name>',
    dbUserName: '<database connection username>',
    dbPassword: '<database connection password>',
    sessionSecret: '<session secret string to generate session>',
};
```

## Running Server

To start the boilerplate express server:

```
node index.js
```
