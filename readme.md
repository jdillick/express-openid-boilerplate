# OpenId Connect SSO Express.js Boilerplate

This project demonstrates a simple node.js/express server that is setup with session middleware for
generic OpenId Connect authentication (IBM oidc by default).

## Environment Setup

Environment variables the boilerplate uses to run by default:

- **ENV_CREDENTIALS_MODULE_FILE**: Full path to node module specifying credentials. See Credentials section below.
- **HTTP_PORT_VAR**: The environment variable used to obtain the plain-text port for the server. (HTTP will run on 8888 if unset)
- **RUN_HTTPS**: Set to run node/express with TLS (defaults to set if NODE_ENV is not production)
- **HTTPS_PORT_VAR**: The environment variable used to obtain the TLS/SSL port for the server. (HTTPS will run on 3333 if not in unset)
- **HTTPS_KEY_FILE**: The full path to the OpenSSL key (PEM) file (defaults to key.pem in the repository if not set).
- **HTTPS_CERT_FILE**: The full path the OpenSSL certificate (PEM) file. (default to cert.pem in repository if not set)
- **HTTPS_PASSPHRASE**: The passphrase for the OpenSSL key. (defaults to "localhost" if not set)
- **SSO_AUTH_REDIRECT_URL**: The FQDN URL to provide to OpenId Connect (in you application), that will handle the return callback after authentication. (e.g. https://localhost:3333/auth [the default] for local or https://myapp.example.com/auth for production)
- **OPENID_ISSUER_URI**: The issuer URL endpoint for your OpenId connect service. (defaults to IBM staging oidc URL)
- **OPENID_AUTHORIZATION_URI**: The authorization URL endpoint for your OpenId connect service. (defaults to IBM staging oidc URL)
- **OPENID_TOKEN_URI**: The token URL endpoint for your OpenId connect service. (defaults to IBM staging oidc URL)
- **USERINFO_URI**: The user info URL endpoint for your OpenId connect service. (defaults to IBM staging oidc URL)
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

Important: the default server will not run if you have not provided the above credentials.

## Running Server

To start the boilerplate express server:

```
node index.js
```
