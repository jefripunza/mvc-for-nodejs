module.exports = (app) => {
    app.use((req, res, next) => { // extra middleware for webserver
        next();
    });
}