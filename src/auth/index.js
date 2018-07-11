const { Op } = require('sequelize');
const moment = require('moment');
const { Issuer } = require('openid-client');

const {
    ssoClientId: client_id,
    ssoClientSecret: client_secret,
} = require(credsModuleFile);

const jwks = {
    "keys": [
        {
            "kty":"RSA",
            "n":"h2lnuuQkUJoVsWsQnOX32_ksKvUQqts0PTINgjKrjfUSR-uVsaqKfWSKo6Qq9p7feImxrduG0dGHg5ZW6BWhM2G8Q2EcEm_CYBUdz_qjhllXh_4oftphubT0OXsgwRKgMmw7G4_vKlXpDMKrDusGfO5ra8BMxE32ada4AtRD7m0zKgBmie8-vRmVbsDFdB84AHGpA7xzI1LqqCBjXVjKddHyq-dSMXyLSE_KiQcnXPPBEBUyY1hP9ao2ZOdiYDpdBcAak4-i40bRFHyzPI2XQtKuU5oKbPl2eS9dZHCyH9U0ADiG-dqRHqnVYtskKjJeG_gb8kazaEXGa5AncdHSAQ",
            "e":"AQAB"
        }
    ]
};

const jwksProd = {
    "keys": [
        {
            "kty": "RSA",
            "alg": "RS256",
            "use": "sig",
            "n": "tbLV6yge386z4xvlRAuX76_Uj1Ef_98JQSIFN0CqqzwF4KT_4o1jsdaPNp-kJdkPaOkBHe7n9faIXuT-gN4SiWQodh2y0xsj31luJF0WnLjmdkDcDRSm_d1TcnAst8DA_0MkhRKBYcXA9YEpAveaaPOq9O-0wyPsccuIsxMez9ix4NjkIEds8q6VvWYOnUfF-vxbi_aVXRN7JRV8k8XV0ipcaLO5oNnENMzQKAkyhuUw3HkRChbtW5uD7StyIn58J6o6ux2aNJwjtga1ZnQ703YLci20ahRex2T33IgmrxJNORGFy_MJd-Nxm3IoXCLwEBoOou0HjQ0dX8V45kLbPw",
            "e": "AQAB"
        }
    ]
}

/**
 * IBMid doesn't have a url to serve json web token keystore files in their openid connect implementation.
 * @see https://w3-connections.ibm.com/wikis/home?lang=en-us#!/wiki/W7d836e46b003_4bb2_9672_4ad712a4bc19/page/Apache%20mod-auth-openidc%20integration
 *
 * Important:
 * The above jwks and jwksProd (unused in this code) are JSON objects that you can serve elsewhere as your jwks_url.
 * You will need to do so to get the openid client to work.
 */
let issuerUrls = {};
if ( process.env.NODE_ENV !== 'production' ) {
    issuerUrls = {
        issuer: process.env.OPENID_ISSUER_URI || 'https://prepiam.toronto.ca.ibm.com',
        authorization_endpoint: process.env.OPENID_AUTHORIZATION_URI || 'https://prepiam.toronto.ca.ibm.com/idaas/oidc/endpoint/default/authorize',
        token_endpoint: process.env.OPENID_TOKEN_URI || 'https://prepiam.toronto.ca.ibm.com/idaas/oidc/endpoint/default/token',
        userinfo_endpoint: process.env.USERINFO_URI || 'https://prepiam.toronto.ca.ibm.com/idaas/oidc/endpoint/default/userinfo',
        jwks_uri: process.env.OPENID_JWKS_URI || 'https://ra-static-site.mybluemix.net/jwks.json',
    };
} else {
    // @todo - update these for production
    issuerUrls = {
        issuer: process.env.OPENID_ISSUER_URI || 'https://prepiam.toronto.ca.ibm.com',
        authorization_endpoint: process.env.OPENID_AUTHORIZATION_URI || 'https://prepiam.toronto.ca.ibm.com/idaas/oidc/endpoint/default/authorize',
        token_endpoint: process.env.OPENID_TOKEN_URI || 'https://prepiam.toronto.ca.ibm.com/idaas/oidc/endpoint/default/token',
        userinfo_endpoint: process.env.USERINFO_URI || 'https://prepiam.toronto.ca.ibm.com/idaas/oidc/endpoint/default/userinfo',
        jwks_uri: process.env.OPENID_JWKS_URI || 'https://ra-static-site.mybluemix.net/jwks-prod.json',
    };
}

const ibmIssuer = new Issuer(issuerUrls);

const client = new ibmIssuer.Client({
    client_id,
    client_secret,
});

module.exports = ({ Session, redirect_uri }) => {
    const authURL = client.authorizationUrl({
        redirect_uri,
        scope: 'openid email'
    });

    return {
        middleWare: (req, res, next) => {
            if ( req.session && req.session.expires && moment().isBefore(moment(req.session.expires))) {
                next();
                return;
            }

            if ( req.path !== '/auth' ) {
                // Clean up expired sessions
                delete req.session.username;
                delete req.session.access_token;
                delete req.session.expires;

                Session.destroy({
                    where: {
                        expires: {
                            [Op.lt]: new Date(),
                        }
                    }
                });

                Session.findOne({
                    where: {
                        session_id: {
                            [Op.eq]: req.session.id,
                        },
                    }
                })
                .then(session => {
                    if (session) {
                        req.session.username = session.username,
                        req.session.access_token = session.access_token;
                        req.session.expires = session.expires;
                        next();
                    } else {
                        res.redirect(authURL);
                    }
                })
                .catch(error => {
                    res.status(500).send('Error occured loading user information.');
                    console.error(error);
                })

            } else {
                next();
            }
        },
        handleAuthRoute: (req, res) => {
            if ( req.session && req.session.expires && moment().isBefore(moment(req.session.expires))) {
                res.redirect('/');
                return;
            }

            client
                .authorizationCallback(redirect_uri, req.query)
                .then(({access_token, expires_at }) => {
                    req.session.access_token = access_token;
                    req.session.expires = moment(new Date(expires_at * 1000)).toISOString();
                    return client.userinfo(access_token)
                })
                .then(({sub}) => {
                    req.session.username = sub;

                    return Session.create({
                        session_id: req.session.id,
                        username: req.session.username,
                        access_token: req.session.access_token,
                        expires: req.session.expires,
                    });
                })
                .then(() => {
                    res.redirect('/');
                })
                .catch(error => console.error(error));
        }
    };
};
