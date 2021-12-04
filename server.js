// ======================== App ========================
// Webserver
const {
    app,
    webserver,
} = require("./app/webserver")

// Web Socket
// const io = require('./app/websocket')(app, webserver)

// ======================== Middlewares ========================
require("./middlewares")(app)

// ======================== Routes ========================
// add routes from file name
require("./routes")(app, [
    "./website",
])