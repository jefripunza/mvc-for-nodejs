const local_ip = Object.values(require('os').networkInterfaces()).map(device => device.filter(ip => ip.family === "IPv4")[0].address).filter(ip => String(ip).startsWith("192.168."))[0]

const env = process.env.NODE_ENV
const isProduction = env === "production"

const app = {
    app_name: "MVC for NodeJS",
    port: process.env.PORT || 5000,
    host: "0.0.0.0",
    local_ip,
}

const website = {
    plus_title: " | " + app.app_name,
}

module.exports = {
    env,
    isProduction,
    app,
    website,
}