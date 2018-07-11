const {
    dbHost: host,
    dbPort: port,
    dbName: database,
    dbUserName: username,
    dbPassword: password,
} = require(credsModuleFile);

const Sequelize = require('sequelize');
const sequelize = new Sequelize(database, username, password, {
    host,
    port,
    dialect: 'mysql',
})

sequelize.authenticate().then(() => {
    console.log(`Successfully connected to database mysql://${host}:${port}/${database}`);
}).catch(error => {
    console.error(`Failed to connect to database mysql://${host}:${port}/${database}`);
    console.error(error);
    process.exit(1);
})

const Models = {
    Session: require('./Session')(sequelize),
};

module.exports = {
    sequelize,
    Models,
};
