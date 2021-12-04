const router = require('express').Router();

/**
 * 
 * @param {*} app 
 * @param {String} from 
 * @param {Array} routes 
 */
module.exports = (app, from, routes) => {
    for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (route.method === "get") {
            router.get(route.path, route.render)
        } else if (route.method === "post") {
            router.post(route.path, route.render)
        } else if (route.method === "put") {
            router.put(route.path, route.render)
        } else if (route.method === "delete") {
            router.delete(route.path, route.render)
        }
    }

    app.use(from, router);
}