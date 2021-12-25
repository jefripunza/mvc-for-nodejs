const path = require('path');
const fs = require('fs');

/**
 * 
 * @param {{ app:any, webserver:any, debug:boolean }} param0 
 * @returns 
 */
module.exports = ({ app, webserver, debug = false }) => {
    const socket = require("socket.io");
    // Socket setup
    const io = socket(webserver);
    if (debug) {
        console.log("Websocket ready!")
    }

    const directoryPath = path.join(__dirname, '..', "websocket");
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        files.forEach(function (files_socket) {
            require("../websocket/" + files_socket)(io, debug)
        });
    });

    app.use((req, res, next) => { // .htaccess replacement
        req.io = io
        next();
    });
    return io
}