// ============ Test Area ============

const Telegram = require("./bot/Telegram")

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_TOKEN;

const user_target = "1228921740"

module.exports = ({ app, webserver }) => {
    async function run() {
        const bot = new Telegram(token)
        bot.listenMessage(async listen => {
            console.log({ listen });
        })
        // setInterval(() => {
        //     bot.sendMessage(user_target, "hai")
        // }, 1000);
    }
    run()
}