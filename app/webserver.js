const config = require('../config');

const express = require('express');
const http = require("http");
const app = express()
const server = http.createServer(app);
const webserver = server.listen(config.app.port, config.app.host, () => {
    require("dns").lookup(require("os").hostname(), function (err, ip_public, fam) {
        console.log(`Server is running at\n http://localhost:${config.app.port} \n http://${ip_public}:${config.app.port} \n http://${config.app.networkInterfaces[0].address}:${config.app.port}`);
    });
})

module.exports = {
    app,
    webserver,
}