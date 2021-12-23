module.exports = (app) => {
    require("./debug")(app)
    require("./security")(app)
    require("./templatingEngine")(app)
    require("./bodyParser")(app)
}