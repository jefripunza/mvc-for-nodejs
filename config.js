const os = require('os');

let networkInterfaces = os.networkInterfaces()
let onlyNetwork = [
    "Wi-Fi",
].map(network => {
    return networkInterfaces[network].filter(select => {
        return select.family === "IPv4"
    })
})[0];

// console.log({ networkInterfaces });
// console.log({ onlyNetwork });

const env = process.env.NODE_ENV
const isProduction = env === "production"

const app = {
    app_name: "NodeJS MVC Example",
    port: process.env.PORT || 5000,
    host: "0.0.0.0",
    networkInterfaces: onlyNetwork,
}

console.log(app.networkInterfaces[0].address);

const website = {
    add_title: " | " + app.app_name,
}

const database = {
    mysql: {
        servername: "",
        username: "",
        password: "",
        dbname: "",
    },
    mongodb: {
        uri: "",
        dbname: "",
    },
}

module.exports = {
    env,
    isProduction,
    app,
    website,
    database,
}