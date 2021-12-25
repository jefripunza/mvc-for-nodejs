const BotFather = require('node-telegram-bot-api');

class Telegram {
    constructor(token) {
        // Create a bot that uses 'polling' to fetch new updates
        const bot = new BotFather(token, { polling: true });
        bot.onText(/\/start/, (msg) => {
            bot.sendMessage(msg.chat.id, "Welcome to My BOT", {
                "reply_markup": {
                    "keyboard": [["status"], ["WebApp"]]
                }
            });
        });
        this.bot = bot
    }
    // ================= Listener =================
    /**
     * 
     * @param {*} listen 
     */
    listenMessage = (listen) => {
        this.bot.on('message', async (msg) => {
            console.log({ msg }); // add debug

            // information
            const username = msg.from.username
            const user_id = msg.from.id
            const user_name = msg.from.last_name ? msg.from.first_name + " " + msg.from.last_name : msg.from.first_name

            // message
            const message_id = msg.message_id;
            const chatId = msg.chat.id;
            const date = msg.date;
            const text = msg.text ? msg.text : null;

            // message type
            const isChat = msg.chat !== undefined
            const isDocument = msg.document !== undefined
            const isVideo = msg.video !== undefined
            const isAudio = msg.audio !== undefined
            const isPhoto = msg.photo !== undefined

            const isBot = msg.from.is_bot
            const isPersonal = user_id === chatId
            const isChannel = msg.sender_chat.type === "channel"
            const isGroup = [
                "supergroup",
                "group",
            ].some(v => msg.chat.type === v) && !isChannel

            // group
            const groupId = msg.from.id
            const groupName = isGroup || isChannel ? msg.sender_chat.title : null
            const groupUserName = isGroup || isChannel ? msg.sender_chat.username : null

            const externalMediaLink = (isGroup || isChannel) && (isDocument) ? 'https://tg.i-c-a.su/media/' + groupUserName + '/' + message_id : null

            return listen({
                msg,

                username, user_id, user_name,
                message_id, chatId, date, text,

                isChat, isDocument, isVideo, isAudio, isPhoto,

                isBot, isPersonal, isChannel, isGroup,

                groupId, groupName, groupUserName,

                externalMediaLink,
            })
        });
    }
    // ================= Sender =================
    /**
     * 
     * @param {string|number} chatId 
     * @param {string} text 
     */
    sendMessage = (chatId, text) => {
        this.bot.sendMessage(chatId, text);
    }
}

module.exports = Telegram;
