const child_process = require('child_process')

function execute(cmd, dirname = __dirname) {
    return new Promise(async (resolve, reject) => {
        child_process.exec(cmd, {
            cwd: dirname,
        }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(error))
            } else {
                resolve(stdout)
            }
        }).stdout.pipe(process.stdout);
    })
}

module.exports = {
    execute,
}