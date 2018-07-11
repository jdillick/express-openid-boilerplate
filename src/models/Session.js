const {
    STRING,
    DATE,
    NOW,
} = require('sequelize');

module.exports = sequelize => sequelize.define('session', {
    session_id: { type: STRING, primaryKey: true },
    username: STRING,
    expires: { type: DATE, defaultValue: NOW },
    id_token: STRING,
    access_token: STRING,
});
