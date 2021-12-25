const {
    execute,
} = require("./utils/execute")

async function run() {
    const commit = process.argv
        .filter((v, i) => {
            return i > 1
        })
        .join(" ")
    const cmd = [
        "git add .",
        `git commit -am "${commit}"`,
        "git push -f origin HEAD:main",
    ].join(" && ")
    try {
        await execute(cmd)
    } catch (error) {
        console.error(error)
    }
}
run()