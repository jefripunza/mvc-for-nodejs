const config = require('../config');

const path = require('path');
const fs = require('fs');

const express = require('express');
const http = require("http");
const app = express()
const server = http.createServer(app);
const webserver = server.listen(config.app.port, config.app.host, () => {
    require("dns").lookup(require("os").hostname(), function (err, ip_dns, fam) {
        console.log([
            "Server is running at",
            `http://localhost:${config.app.port}`,
            `http://${ip_dns}:${config.app.port}`,
            `http://${config.app.local_ip}:${config.app.port}`,
        ].join("\n "));
    });
})

// ======================== Middlewares ========================
require("../middlewares")(app)

const directoryPath = path.join(__dirname, '..', "routes");
fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach(function (route) {
        require("../routes/" + route)(app)
    });

    // page not found
    app.get("*", (req, res) => {
        res.render("errors/404")
    })
});

module.exports = {
    app,
    webserver,
}