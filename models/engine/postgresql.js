if (process.env.PG_HOST === undefined || process.env.PG_USER === undefined || process.env.PG_PASS === undefined || process.env.PG_DATABASE === undefined || process.env.PG_PORT === undefined) {
    console.log("please fill in the PostgreSQL require (PG_HOST, PG_USER, PG_PASS, PG_DATABASE, PG_PORT) in .env file !");
    process.exit(1);
}

const Pool = require('pg').Pool
const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'password',
    database: 'postgis_31_sample',
    port: 5432,
})

pool.query('SELECT NOW()', (err, res) => {
    console.log(err, res)
    pool.end()
})