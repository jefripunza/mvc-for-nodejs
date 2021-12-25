console.log('\033[2J'); // clear CLI
require("dotenv").config() // add .env


// ======================== App ========================
// Webserver
const {
    app,
    webserver,
} = require("./app/webserver")({
    templatingEngine: "ejs",
    bodyParser: true,
    secure: true,
    // debug: true,
    pageNotFound: (req, res) => {
        res.render("errors/404")
    },
})

// Web Socket
const io = require('./app/websocket')({
    app,
    webserver,
    // debug: true,
})



// ======================== Bot ========================



// ========= Test Area =========
require("./test")({
    app,
    webserver,
    io,
})