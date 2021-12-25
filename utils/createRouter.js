const router = require('express').Router();

/**
 * 
 * @param {*} app 
 * @param {String} from 
 * @param {[{ path:string, method:string, middleware:function, render:function }]} routes 
 */
module.exports = (app, from, routes) => {
    for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (route.method === "get") {
            if (route.middleware) {
                router.get(route.path, route.middleware, route.render)
            } else {
                router.get(route.path, route.render)
            }
        } else if (route.method === "post") {
            if (route.middleware) {
                router.post(route.path, route.middleware, route.render)
            } else {
                router.post(route.path, route.render)
            }
        } else if (route.method === "put") {
            if (route.middleware) {
                router.put(route.path, route.middleware, route.render)
            } else {
                router.put(route.path, route.render)
            }
        } else if (route.method === "delete") {
            if (route.middleware) {
                router.delete(route.path, route.middleware, route.render)
            } else {
                router.delete(route.path, route.render)
            }
        } else if (route.method === "patch") {
            if (route.middleware) {
                router.patch(route.path, route.middleware, route.render)
            } else {
                router.patch(route.path, route.render)
            }
        } else if (route.method === "options") {
            if (route.middleware) {
                router.options(route.path, route.middleware, route.render)
            } else {
                router.options(route.path, route.render)
            }
        }
    }

    app.use(from, router);
}