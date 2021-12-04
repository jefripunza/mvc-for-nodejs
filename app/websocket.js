
/**
 * 
 * @param {*} app 
 * @param {*} webserver 
 * @returns 
 */
module.exports = (app, webserver) => {
    const socket = require("socket.io");
    // Socket setup
    const io = socket(webserver);

    io.on("connection", function (socket) {
        console.log("new socket connection");
    });

    app.use((req, res, next) => { // .htaccess replacement
        req.io = io
        next();
    });
    return io
}