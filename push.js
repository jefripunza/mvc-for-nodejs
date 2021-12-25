
const { exec } = require('child_process');

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
    console.log({ cmd, commit });

    try {
        await exec(cmd, (error, stdout, stderr) => {
    
        });
    } catch (error) {
        console.error(error)
    }
}
run()