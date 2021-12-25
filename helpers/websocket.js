module.exports = {
    getFromWebSocket: (socket) => {
        const {
            headers,
        } = socket.handshake
        const id = socket.id
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.headers["x-real-ip"] || String(socket.request.connection.remoteAddress).split(":")[3]

        return {
            headers,
            id,
            ip,
        }
    }
}