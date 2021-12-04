/**
 * 
 * @param {*} app 
 * @param {Array} filename 
 */
module.exports = (app, filename) => {
    for (let i = 0; i < filename.length; i++) {
        const file = filename[i];
        require(file)(app)
    }

    // page not found
    app.get("*", (req, res) => {
        res.render("errors/404")
    })
}