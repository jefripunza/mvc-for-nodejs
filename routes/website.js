module.exports = (app) => {
    const controllers = require('../controllers'); // change your controllers
    require("../utils/createRouter")(app, "/", [
        {
            path: "/",
            method: "get",
            render: controllers.index,
        },
        {
            path: "/contact",
            method: "get",
            render: controllers.contact,
        },
        {
            path: "/about",
            method: "get",
            render: controllers.about,
        },
    ])
}