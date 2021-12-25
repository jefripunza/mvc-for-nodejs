const {
    getFromWebSocket,
} = require("../helpers/websocket")

module.exports = (io, debug) => {
    if (debug) {
        console.log("socket on connect ready...")
    }

    io.of('/connect').on("connection", function (socket) {
        console.log("new socket connection on connect");
        const {
            headers,
            id,
            ip,
        } = getFromWebSocket(socket)
        // console.log({ headers }); // debug

        socket.on('disconnect', function () {
            console.log('Got disconnect! ' + id);
        });
    });
}