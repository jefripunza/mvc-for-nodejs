module.exports = (app) => {
    const controllers = require('../controllers/website'); // change your controllers
    // add your private middleware
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