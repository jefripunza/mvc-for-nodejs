if (process.env.DB_USER === undefined || process.env.DB_PASS === undefined || process.env.DB_NAME === undefined) {
    console.log("please fill in the MySQL require (DB_USER, DB_PASS, DB_NAME) in .env file !");
    process.exit(1);
}

function sql_injection(value) {
    return String(value).replace(/'/g, "\\'");
}

const mysql = require('mysql');
// koneksi server
const database = mysql.createConnection({
    host: "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
});
database.connect(function (err) {
    if (err) {
        console.log("Error connecting to MySQL!");
        process.exit(1);
    };
    console.log(`Database Connected! (${process.env.DB_NAME})`);
});

/**
 * 
 * @param {string} query
 */
function CustomQuery(query) {
    return new Promise(async (resolve, reject) => {
        database.query(query, function (err, result, fields) {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        });
    })
}

/**
 * 
 * @param {string} table 
 * @param {string} order_by 
 * @param {string} order_by_from 
 * @returns 
 */
function ListTable(table, order_by = "DESC", order_by_from = "id") {
    return new Promise(async (resolve, reject) => {
        database.query(`SELECT * FROM ${table} ORDER BY ${order_by_from} ${order_by}`, function (err, res) {
            if (err) {
                reject(err)
            } else {
                resolve(res);
            }
        });
    })
}

/**
 * 
 * @param {string} table 
 * @param {[]} column_array 
 * @param {[]} value_array 
 * @returns 
 */
function InsertData(table, column_array, value_array) {
    let column = "(";
    for (let i = 0; i < column_array.length; i++) {
        if (i > 0) {
            column += ",";
        }
        column += column_array[i];
    }
    column += ")";
    return new Promise(async (resolve, reject) => {
        database.query(`INSERT INTO ${table} ${column} VALUES ?`, [value_array], function (err, result) {
            if (err) {
                reject(err)
            } else {
                console.log("Number of records inserted: " + result.affectedRows);
                resolve(result);
            }
        });
    })
}

/**
 * 
 * @param {string} table 
 * @param {string} id 
 * @param {{}} set_object 
 * @returns 
 */
function UpdateWhereID(table, id, set_object) {
    const keys = Object.keys(set_object);
    const values = Object.values(set_object);
    let change = "";
    for (let i = 0; i < keys.length; i++) {
        if (i > 0) {
            change += ",";
        }
        const key = keys[i];
        const value = sql_injection(String(values[i]));
        change += `${key}='${value}'`;
    }
    return new Promise(async (resolve, reject) => {
        database.query(`UPDATE ${table} SET ${change} WHERE id='${sql_injection(id)}'`, function (err, result) {
            if (err) {
                reject(err)
            } else {
                console.log(result.affectedRows + " record(s) updated");
                resolve(result);
            }
        });
    })
}

/**
 * 
 * @param {string} table 
 * @param {{}} where_single_object 
 * @param {{}} set_object 
 * @returns 
 */
function UpdateWhere(table, where_single_object, set_object) {
    const keys = Object.keys(set_object);
    const values = Object.values(set_object);
    let change = "";
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = sql_injection(String(values[i]));
        if (i > 0) {
            change += ",";
        }
        change += `${key}='${value}'`;
    }
    return new Promise(async (resolve, reject) => {
        database.query(`UPDATE ${table} SET ${change} WHERE ${Object.keys(where_single_object)}='${sql_injection(String(Object.values(where_single_object)))}'`, function (err, result) {
            if (err) {
                reject(err)
            } else {
                console.log(result.affectedRows + " record(s) updated");
                resolve(result);
            }
        });
    })
}

/**
 * 
 * @param {string} table 
 * @param {string} id 
 * @returns 
 */
function DeleteWhereID(table, id) {
    return new Promise(async (resolve, reject) => {
        database.query(`DELETE FROM ${table} WHERE id='${sql_injection(id)}'`, function (err, result) {
            if (err) {
                reject(err)
            } else {
                console.log("Number of records deleted: " + result.affectedRows);
                resolve(result);
            }
        });
    })
}

/**
 * 
 * @param {string} table 
 * @param {{}} where_single_object 
 * @returns 
 */
function DeleteWhere(table, where_single_object) {
    return new Promise(async (resolve, reject) => {
        database.query(`DELETE FROM ${table} WHERE ${Object.keys(where_single_object)}='${sql_injection(String(Object.values(where_single_object)))}'`, function (err, result) {
            if (err) {
                reject(err)
            } else {
                console.log("Number of records deleted: " + result.affectedRows);
                resolve(result);
            }
        });
    })
}




// =========== system ===========

/**
 * 
 * @param {string} name 
 * @returns 
 */
function ValueSystem(name) {
    return new Promise(async (resolve, reject) => {
        database.query(`SELECT * FROM system WHERE name='${sql_injection(name)}'`, function (err, result, fields) {
            if (err) {
                reject(err)
            } else {
                if (result.length > 0) {
                    resolve(result[0].value)
                } else {
                    resolve(undefined)
                }
            }
        });
    })
}

/**
 * 
 * @param {string} name 
 * @param {string} value 
 * @returns 
 */
function UpdateSystem(name, value) {
    return new Promise(async (resolve, reject) => {
        database.query(`UPDATE system SET value='${sql_injection(value)}' WHERE name='${sql_injection(name)}'`, function (err, result) {
            if (err) {
                reject(err)
            } else {
                console.log(result.affectedRows + " record(s) updated");
                resolve(result);
            }
        })
    })
}

module.exports = {
    CustomQuery,
    ListTable,
    InsertData,
    UpdateWhereID,
    UpdateWhere,
    DeleteWhereID,
    DeleteWhere,
    ValueSystem,
    UpdateSystem,
}
