const child_process = require('child_process')
const { exec } = require('child_process');

function execute(cmd, dirname = __dirname) {
    return new Promise(async (resolve, reject) => {
        child_process.exec(cmd, {
            cwd: dirname,
        }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(error))
            } else {
                resolve(true)
            }
        }).stdout.pipe(process.stdout);
    })
}

async function run() {
    const commit = process.argv
        .filter((v, i) => {
            return i > 1
        })
        .join(" ")
    const cmd = [
        "git add .",
        `git commit -m "${commit}"`,
        "git push -u origin main",
    ].join(" && ")
    console.log({ cmd });
    try {
        await execute(cmd)
    } catch (error) {
        console.error(error)
    }
}
run()