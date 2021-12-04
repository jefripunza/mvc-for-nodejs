const Database = require("@replit/database")
const db = new Database()

const {
    generateRandomString,
} = require("../../helpers/generate")

exports.insert = (database, value) => {
    const new_key = generateRandomString()
    return new Promise(async (resolve, reject) => {
        if (typeof value === "object" && !Array.isArray(value) && value != undefined) {
            const new_data = value
            new_data._database = database
            db.set(new_key, new_data)
                .then(() => {
                    console.log("inserted...")
                    resolve(true)
                })
                .catch(reject)
        } else {
            reject("value is not object!")
        }
    })
}

exports.list = (database) => {
    return new Promise(async (resolve, reject) => {
        db.list()
            .then(async (keys) => {
                const values = []
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    const value = await get(key)
                    value._id = key
                    values.push(value)
                }
                resolve(
                    values
                        .filter(v => {
                            return v._database === database
                        })
                        .map(v => {
                            delete v._database
                            return v
                        })
                )
            })
            .catch(reject)
    })
}


const get = (_id) => {
    return new Promise(async (resolve, reject) => {
        db.get(_id)
            .then(value => {
                resolve(value)
            })
            .catch(reject)
    })
}
exports.get = get

const get_database = (_id) => {
    return new Promise(async (resolve, reject) => {
        db.get(_id)
            .then(value => {
                resolve(
                    value
                        .map(v => {
                            return v._database
                        })
                )
            })
            .catch(reject)
    })
}
exports.get = get_database

exports.update = (_id, value) => {
    return new Promise(async (resolve, reject) => {
        if (typeof value === "object" && !Array.isArray(value) && value != undefined) {
            const new_data = await get(_id)
            const keys = Object.keys(value)
            const values = Object.values(value)
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                const value = values[i]
                if (!String(key).startsWith("_")) {
                    new_data[key] = value
                }
            }
            db.set(_id, new_data)
                .then(() => {
                    console.log("updated...")
                    resolve(true)
                })
                .catch(reject)
        } else {
            reject("value is not object!")
        }
    })
}

exports.delete = (_id) => {
    return new Promise(async (resolve, reject) => {
        db.delete(_id)
            .then(() => {
                console.log("deleted...")
                resolve(true)
            })
            .catch(reject)
    })
}
