const config = require('../config');

// Middleware Security
module.exports = (app) => {
    const helmet = require('helmet');
    app.use(helmet()) // see : https://helmetjs.github.io/
    app.use((req, res, next) => { // .htaccess replacement
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'x-www-form-urlencoded, Origin, X-Requested-With, Content-Type, Accept, Authorization, *');
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Credentials', true);
            return res.status(200).json({});
        }
        next();
    });
}