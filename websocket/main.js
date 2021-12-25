const {
    getFromWebSocket,
} = require("../helpers/websocket")

const allow = [ // example token
    3892473247,
    2353242342,
    1234567890,
]

module.exports = (io, debug) => {
    if (debug) {
        console.log("socket on main ready...")
    }

    io.use(function (socket, next) { // secure connection
        const handshakeData = socket.request;
        if (handshakeData.headers.authorization) {
            if (allow.some(ok => parseInt(handshakeData.headers.authorization) === ok)) {
                next();
            } else {
                next(new Error('authorization not found.'));
            }
        } else {
            next(new Error('No authorization found.'));
        }
    });

    io.on("connection", function (socket) {
        console.log("new socket connection on main");
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