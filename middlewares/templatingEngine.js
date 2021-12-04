const config = require('../config');

// Middleware Templating Engine
module.exports = (app) => {
    app.set("view engine", "ejs")
}