const config = require('../config');

const path = require('path');
const fs = require('fs');

const express = require('express');
const http = require("http");
const app = express()
const server = http.createServer(app);

module.exports = (option = {}) => {
    const webserver = server.listen(config.app.port, config.app.host, () => {
        if (option.debug) {
            require("dns").lookup(require("os").hostname(), function (err, ip_dns, fam) {
                console.log([
                    "Server is running at",
                    `http://localhost:${config.app.port}`,
                    `http://${ip_dns}:${config.app.port}`,
                    `http://${config.app.local_ip}:${config.app.port}`,
                ].join("\n "));
            });
        }
    })

    // ======================== Middlewares ========================
    require("../middlewares/webserver")(app)
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

    const directoryPath = path.join(__dirname, '..', "routes");
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        files.forEach(function (route) {
            require("../routes/" + route)(app)
        });

        // page not found (modify)
        if (option.pageNotFound) {
            app.get("*", option.pageNotFound)
        }
    });

    if (option.templatingEngine) {
        app.set("view engine", option.templatingEngine)
    }

    if (option.bodyParser) {
        const bodyParser = require('body-parser')
        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({
            extended: true,
        }))
    }

    if (option.secure) {
        const helmet = require('helmet');
        app.use(helmet()) // see : https://helmetjs.github.io/
    }

    if (option.debug) {
        const morgan = require('morgan');
        if (!config.isProduction) {
            app.use(morgan("dev"))
        }
    }

    return {
        app,
        webserver,
    }
}