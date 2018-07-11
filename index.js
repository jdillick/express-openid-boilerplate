const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const moment = require('moment');

global.credsModuleFile = process.env.ENV_CREDENTIALS_MODULE_FILE || path.resolve(__dirname, 'env.js');
const HTTP_PORT_VAR = process.env.HTTP_PORT_VAR || 'HTTP_PORT';
const HTTP_PORT = process.env[HTTP_PORT_VAR] || 8888;
const HTTPS_PORT_VAR = process.env.HTTPS_PORT_VAR || 'HTTPS_PORT';
const HTTPS_PORT = process.env[HTTPS_PORT_VAR] || 3333;
const RUN_HTTPS = 'RUN_HTTPS' in process.env || process.env.NODE_ENV !== 'production';
const HTTPS_KEY_FILE = process.env.HTTPS_KEY_FILE || path.resolve(__dirname, 'key.pem');
const HTTPS_CERT_FILE = process.env.HTTPS_CERT_FILE || path.resolve(__dirname, 'cert.pem');
const HTTPS_PASSPHRASE = process.env.HTTPS_PASSPHRASE || 'localhost';

const { sequelize, Models } = require('./src/models');

// redirect_uri needed by ./src/auth module
let redirect_uri = '';
if ( process.env.NODE_ENV !== 'production' ) {
    redirect_uri = `https://localhost:${HTTPS_PORT}/auth`;
}
if ( process.env.SSO_AUTH_REDIRECT_URL ) {
    redirect_uri = process.env.SSO_AUTH_REDIRECT_URL;
}

const {
    middleWare: authMiddleware,
    handleAuthRoute
} = require('./src/auth')({ redirect_uri, Session: Models.Session });

const {
    sessionSecret: secret,
} = require(credsModuleFile);

let sessionOptions = {
    name: 'ippf.connect.sid',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        httpOnly: false,
        sameSite: 'lax',
    },
};

// Authorization / Session middleware
app.use(session(sessionOptions));
app.use(authMiddleware);

// Return URI for OpenId Connect callback.
app.get('/auth', handleAuthRoute);

app.get('/', (req, res) => {
    const expires = moment(req.session.expires).from(moment());
    res.send(`hello, ${req.session.username}. Your login will expire ${expires}`)
})

app.listen(HTTP_PORT, () => {
    console.log(`HTTP server running on port ${HTTP_PORT}`);

    // Create db tables if they do not exist
    Object.keys(Models).forEach(model => {
        const Model = Models[model];
        console.log(`Syncing model ${model}...`);
        Model.sync()
        .then(() => `Model ${model} synchronized.`)
        .catch(error => console.error(`Error synchronizing model ${model}`, error))
    })
})

if ( RUN_HTTPS ) {
    https.createServer({
        key: fs.readFileSync(HTTPS_KEY_FILE),
        cert: fs.readFileSync(HTTPS_CERT_FILE),
        passphrase: HTTPS_PASSPHRASE,
    }, app)
    .listen(HTTPS_PORT, () => {
        console.log(`HTTPS server running on port ${HTTPS_PORT}`);
    });
}

// Handle Process Exit Events
const exitHandler = (options, error) => {
    console.log(`Recieved ${options.type} event.`)
    if (options.exit) {
        console.log('Exiting...');
        sequelize.close();

        if (error) {
            console.error(error.stack);
            process.exit(1);
        }

        process.exit(0);
    }
};

process.on('exit', exitHandler.bind(null, { type: 'exit', exit: true }));
process.on('SIGINT', exitHandler.bind(null, { type: 'SIGINT', exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { type: 'SIGUSR1', exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { type: 'SIGUSR2', exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { type: 'uncaughtException', exit: true }));
