const {
    execute,
} = require("./utils/execute")

async function run() {
    const get_remote = (await execute("git remote -v"))
        .split("\n")[0]
        .split("\t")[1]
        .split(" ")[0]
    const cmd = [
        `git remote add upstream ${get_remote}`,
        "git fetch upstream",
        "git merge upstream/main",
    ].join(" && ")
    console.log({ cmd });
    try {
        await execute(cmd)
    } catch (error) {
        console.error(error)
    }
}
run() 