console.log('\033[2J'); // clear CLI

require("dotenv").config()

// ======================== App ========================
// Webserver
const {
    app,
    webserver,
} = require("./app/webserver")

// Web Socket
// const io = require('./app/websocket')(app, webserver)




// ======================== Test Area ========================

async function run() {

}
run()