const config = require('../config');

// Middleware Development Mode
module.exports = (app) => {
    const morgan = require('morgan');
    if (!config.isProduction) {
        app.use(morgan("dev"))
    }
}