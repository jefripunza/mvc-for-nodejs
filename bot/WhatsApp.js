// ============================== 1st ==============================
const fs = require("fs");
const path = require('path');

// ============================== 3th ==============================
// whatsapp this module
const {
    WAConnection,
    MessageType,
    Presence,
    MessageOptions,
    Mimetype,
    WALocationMessage,
    WA_MESSAGE_STUB_TYPES,
    ReconnectMode,
    ProxyAgent,
    waChatKey,
} = require("@adiwajshing/baileys");
// styling
const emoji = require('node-emoji');
// parsing data
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// text to speech
const googleTTS = require("google-tts-api");

// ============================== Function ==============================
const {
    generateRandomString,
    generateRandomOTP,
} = require("../helpers/generate")

class WhatsApp {
    /**
     * WhatsApp Bot (baileys)
     * @param {string} SESSION_NAME tempat menyimpan session file
     * @param {{ bot_name:string, prefix:string, owner:[] }} option 
     */
    constructor(SESSION_NAME, option = {}) {
        const conn = new WAConnection();
        //
        this.conn = conn;
        const session_folder = path.join(__dirname, "session");
        if (!fs.existsSync(session_folder)) {
            fs.mkdirSync(session_folder);
            console.log('session Directory Created Successfully.');
        }
        this.SESSION_NAME = path.join(session_folder, SESSION_NAME);
        //
        this.option = option;
        this.bot_name = option.bot_name ? option.bot_name : "*From BOT*";
        this.prefix = option.prefix ? option.prefix : "!";
        this.owner = option.owner ? option.owner : ["6282214252455"];
        //
        this.connect();
    }
    connect = async () => {
        if (this.option.autoReconnect !== undefined) {
            /**
             * onAllErrors
             * onConnectionLost // only automatically reconnect when the connection breaks
             */
            this.conn.autoReconnect = ReconnectMode[this.option.autoReconnect]; // specific
        } else {
            this.conn.autoReconnect = ReconnectMode.onAllErrors; // default
        }
        this.conn.connectOptions.maxRetries = 10000;
        // this.conn.version = await this.check_version();
        // this.conn.version = [
        //     2,
        //     2142,
        //     12
        // ];
        if (this.option.debug) {
            this.conn.logger.level = "debug";
            this.conn.chatOrderingKey = waChatKey(true); // order chats such that pinned chats are on top
        }
        this.conn.on('open', async () => {
            await fs.writeFileSync(this.SESSION_NAME, JSON.stringify(this.conn.base64EncodedAuthInfo(), null, '\t')); // nyimpen sesi baru
        });
        if (fs.existsSync(this.SESSION_NAME)) {
            this.conn.loadAuthInfo(this.SESSION_NAME);
        }
        this.conn.on('close', async ({ reason, isReconnecting }) => {
            if (this.option.debug) {
                console.log('oh no got disconnected: ' + reason + ', reconnecting: ' + isReconnecting);
            }
            if (reason === "invalid_session") {
                this.logout(async () => {
                    await this.conn.connect(); // reconnect
                })
            } else {
                if (this.option.reconnect) {
                    await this.conn.connect(); // reconnect
                }
            }
        })
        setTimeout(async () => {
            await this.conn.connect(); // auto connect after declaration
        }, 500);
    }
    reconnect = () => {
        this.conn.connect(); // reconnect
    }
    /**
     * 
     * @param {callback} onSuccess ketika selesai logout
     */
    logout = (onSuccess) => {
        this.deleteSession(() => {
            this.conn.clearAuthInfo()
            setTimeout(() => {
                try {
                    this.sendMessage(this.conn.user.jid, "logout....")
                    onSuccess();
                } catch (error) {
                    onSuccess();
                }
            }, 1000);
        })
    }
    // =============================== TEMPLATE ===============================
    /**
     * 
     * @param {string} text 
     * @param {boolean} before_enter 
     * @returns 
     */
    templateItemNormal = (text, before_enter = false) => {
        const value_enter = before_enter ? "\n" : "";
        return `${value_enter}${text}${value_enter}\n`;
    }
    templateItemEnter = () => {
        return `\n`;
    }
    templateItemSkip = () => {
        return `  ​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​\n`;
    }
    /**
     * 
     * @param {string} key 
     * @param {string|array|{}} value 
     * @param {boolean} enter 
     * @returns 
     */
    templateItemVariable = (key, value, enter = false) => {
        const value_enter = enter ? "\n" : "";
        let inject = "";
        if (this.isArray(value)) {
            inject += value
                .map((v) => {
                    return v;
                })
                .join("\n");
        } else {
            if (this.isObject(value)) {
                inject += Object.values(value)
                    .map((v) => {
                        return v;
                    })
                    .join("\n");
            } else {
                inject += value;
            }
        }
        return `├ ${key} : ${value_enter + value_enter}${inject}\n${value_enter}`;
    }
    /**
     * 
     * @param {string} title 
     * @param {array} array 
     * @returns 
     */
    templateItemTitle = (title, array = false) => {
        const length = String(title).length;
        const alinyemen = 10 - length;
        const kanan_kiri = "=".repeat(alinyemen + length / 2);
        let print = `${kanan_kiri} ${title} ${kanan_kiri}\n`;
        if (array && this.isArray(array)) {
            print += array
                .map((v) => {
                    return "- " + v + "\n";
                })
                .join("\n");
            print += "\n\n";
        }
        return print;
    }
    /**
     * 
     * @param {string} title 
     * @param {string} cmd 
     * @param {string|array|{}} note 
     * @returns 
     */
    templateItemCommand = (title, cmd, note = false) => {
        const point_right = emoji.find("point_right").emoji;
        let inject = "";
        if (note) {
            inject += "\n";
            if (this.isArray(note)) {
                inject += note
                    .map((v) => {
                        return v + "\n";
                    })
                    .join("");
            } else {
                if (this.isObject(note)) {
                    inject += Object.keys(note)
                        .map((key) => {
                            return key + " : " + note[key] + "\n";
                        })
                        .join("");
                } else {
                    inject += note;
                }
            }
        }
        const inject_cmd = String(cmd).length > 0 ? `\n${point_right} ${cmd}\n` : "";
        return `├ ${title} :${inject_cmd} ${inject}\n`;
    }
    /**
     * 
     * @param {string} key 
     * @param {array} array 
     * @param {string|array|{}} enter 
     * @returns 
     */
    templateItemList = (key, array, enter = false) => {
        if (this.isArray(array)) {
            const value_enter = enter ? "\n" : "";
            const inject = array
                .map((v) => {
                    return "- " + v;
                })
                .join("");
            return `├ ${key} : \n${value_enter}${inject}${value_enter}\n`;
        }
    }
    /**
     * 
     * @param {string} text 
     * @returns 
     */
    templateItemNext = (text = "") => {
        return `│ ${text}\n`;
    }
    /**
     * 
     * @param {string} title 
     * @param {array} text_array 
     * @returns 
     */
    templateFormat = (title, text_array) => {
        const text_inject = text_array.join("");
        return `┌─「 _*${title}*_ 」\n│\n${text_inject}│\n└─「 >> _*${this.bot_name}*_ << 」`;
    }
    // ================================ DEFINE ================================
    blocked = []
    // ================================ REQUEST ===============================
    check_version = async () => {
        const check = await this.fetchJson("https://web.whatsapp.com/check-update?version=1&platform=web")
        return String(check.currentVersion).split(".").map(v => {
            return parseInt(v)
        });
    }
    /**
     * 
     * @param {string} url 
     * @param {boolean} post 
     * @returns 
     */
    fetchJson = async (url, post = false) => new Promise(async (resolve, reject) => {
        const request = await fetch(url, {
            headers: { "User-Agent": "okhttp/4.5.0" },
            method: post ? "POST" : "GET",
        })
        console.log({ request });
        if ([
            200,
        ].some(v => request.status === v)) {
            const data = await request.json();
            data._status = request.status;
            resolve(data);
        } else {
            resolve({
                _status: request.status,
                message: request.statusText,
            })
        }
    })
    /**
     * 
     * @param {string} url 
     * @returns 
     */
    getBuffer = async (url) => {
        const res = await fetch(url, {
            headers: { "User-Agent": "okhttp/4.5.0" },
            method: "GET",
        }); // dia harus mandiri
        const no_image = fs.readFileSync(
            path.join(__dirname, "..", "src", "no_image.jpg")
        );
        if (!res.ok) return { type: "image/jpeg", result: no_image };
        let buff = await res.buffer();
        if (buff) {
            const type = res.headers.get("content-type");
            if (type === "image/webp") {
                const new_buff = await sharp(buff).jpeg().toBuffer();
                buff = new_buff;
            }
            return { type, result: buff };
        }
    };
    // =============================== FUNCTION ===============================
    /**
     * 
     * @param {*} value 
     * @returns 
     */
    isArray(value) {
        return typeof value === "object" && Array.isArray(value) && value !== null;
    }
    /**
     * 
     * @param {*} value 
     * @returns 
     */
    isObject(value) {
        return typeof value === "object" && !Array.isArray(value) && value !== null;
    }
    /**
     * 
     * @param {string} location 
     * @param {function} onSuccess 
     */
    deleteFile = async (location, onSuccess) => {
        await fs.unlink(location, (err) => {
            if (err) {
                console.error(err);
                return;
            } else {
                onSuccess();
            }
        });
    }
    /**
     * 
     * @param {function} onSuccess 
     */
    deleteSession = async (onSuccess) => {
        await fs.unlink(this.SESSION_NAME, (err) => {
            if (err) {
                console.error(err);
                return;
            } else {
                console.log("Session file deleted!");
                onSuccess();
            }
        });
    }
    /**
     * 
     * @param {string} filename 
     * @returns 
     */
    temp = (filename) => {
        const tempDir = path.join(__dirname, "..", "Temp")
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
            console.log('Temp Directory Created Successfully.');
        }
        return path.join(tempDir, filename)
    }
    /**
     * 
     * @param {number} bytes 
     * @param {number} decimals 
     * @returns 
     */
    formatBytes = (bytes, decimals = 2) => {
        const fix_bytes = parseInt(bytes),
            fix_decimals = parseInt(decimals)
        if (fix_bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = fix_decimals < 0 ? 0 : fix_decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(fix_bytes) / Math.log(k));
        return parseFloat((fix_bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    /**
     * 
     * @param {string} extension 
     * @returns 
     */
    getRandomFile = (extension) => {
        return generateRandomString() + "." + extension;
    }
    /**
     * 
     * @param {string|number} number 
     * @param {string} standard 
     * @returns 
     */
    formatter = (number, standard = "@c.us") => {
        let formatted = number;
        // const standard = '@c.us'; // @s.whatsapp.net / @c.us
        if (!String(formatted).endsWith("@g.us")) {
            // isGroup ? next
            // 1. Menghilangkan karakter selain angka
            formatted = number.replace(/\D/g, "");
            // 2. Menghilangkan angka 62 di depan (prefix)
            //    Kemudian diganti dengan 0
            if (formatted.startsWith("0")) {
                formatted = "62" + formatted.substr(1);
            }
            // 3. Tambahkan standar pengiriman whatsapp
            if (!String(formatted).endsWith(standard)) {
                formatted += standard;
            }
        }
        return formatted;
    }
    /**
     * 
     * @param {number} seconds 
     * @returns 
     */
    detikKeWaktu = (seconds) => {
        const fix_seconds = parseInt(seconds)
        function pad(s) {
            return (s < 10 ? '0' : '') + s;
        }
        var hours = Math.floor(fix_seconds / (60 * 60));
        var minutes = Math.floor(fix_seconds % (60 * 60) / 60);
        var ok_seconds = Math.floor(fix_seconds % 60);
        return `${pad(hours)} Jam ${pad(minutes)} Menit ${pad(ok_seconds)} Detik`
    }
    uptime = () => {
        const uptime = process.uptime()
        return this.detikKeWaktu(uptime)
    }
    // =============================== FUNCTION WHATSAPP ===============================
    /**
     * 
     * @param {String|Number} from 
     * @param {function} isTrue 
     * @param {function} isNotFound 
     */
    isRegisteredUser = async (from, isTrue, isNotFound) => {
        await this.conn.isOnWhatsApp(this.formatter(from))
            .then((result) => {
                if (result) {
                    isTrue(result)
                } else {
                    isNotFound();
                }
            })
    }
    /**
     * 
     * @param {String|Number} from 
     * @param {function} value 
     */
    getProfilePicture = async (from) => {
        let url;
        try {
            url = await this.conn.getProfilePicture(from);
        } catch {
            url = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
        }
        return url
    }
    /**
     * 
     * @param {{}} member 
     * @returns 
     */
    getNameUser = (member) => {
        if (this.conn.user.jid === member.jid) {
            return this.bot_name;
        }
        return member.notify || member.vname || member.jid;
    }
    /**
     * 
     * @param {array} participants 
     * @returns 
     */
    getGroupAdmins = (participants) => {
        const admins = []
        for (let i of participants) {
            i.isAdmin ? admins.push(i) : ''
        }
        return admins
    }
    listMyGroup = async () => {
        let getGroups = await this.conn.chats;
        let objGroup = { groups: [] };
        let members = getGroups.array;
        for (var key in members) {
            if (members[key].jid.indexOf('@g.us') != -1) {
                objGroup.groups.push({
                    id: members[key].jid,
                    name: members[key].name
                });
            }
        }
        return objGroup;
    }
    //// Group Management
    // hide tag
    /**
     * 
     * @param {string} group_id 
     * @param {array} array_user_id 
     * @param {function} onSuccess 
     */
    addMemberToGroup = async (group_id, array_user_id, onSuccess) => {
        const list_user = array_user_id.map(v => {
            return this.formatter(v, "@s.whatsapp.net");
        })
        await this.conn.groupAdd(group_id, [...list_user])
            .then(() => {
                if (onSuccess)
                    onSuccess()
            })
    }
    /**
     * 
     * @param {string} group_id 
     * @param {array} target 
     */
    promoteAdmin = async (group_id, target = []) => {
        const group_meta = await this.conn.groupMetadata(group_id)
        const owner = group_meta.owner.replace("c.us", "s.whatsapp.net")
        const me = this.conn.user.jid
        for (i of target) {
            if (!i.includes(me) && !i.includes(owner)) {
                console.log(i);
                await this.conn.groupMakeAdmin(group_id, [this.formatter(i)])
            } else {
                await this.sendMessage(group_id, "Not Premited!")
                break
            }
        }
    }
    /**
     * 
     * @param {string} group_id 
     * @param {array} target 
     */
    demoteAdmin = async (group_id, target = []) => {
        const group = await this.conn.groupMetadata(group_id)
        const owner = group.owner.replace("c.us", "s.whatsapp.net")
        const me = this.conn.user.jid
        let i;
        for (i of target) {
            if (!i.includes(me) && !i.includes(owner)) {
                console.log("KICK...");
                await this.conn.groupDemoteAdmin(group_id, [i])
            } else {
                await this.sendMessage(group_id, "Not Premited!")
                break
            }
        }
    }
    /**
     * 
     * @param {string} id 
     * @param {boolean} all 
     * @returns 
     */
    getGroupParticipants = async (id, all = false) => {
        var members = await this.conn.groupMetadata(id)
        var members = members.participants
        let mem = []
        for (let i of members) {
            if (all) {
                mem.push(i)
            } else {
                mem.push(i.jid)
            }
        }
        return mem
    }
    /**
     * 
     * @param {string} from 
     * @param {string} text 
     */
    hideTag = async (from, text) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, text, MessageType.text, { contextInfo: { mentionedJid: members } })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} quoted 
     * @param {string} text 
     */
    hideTagWithMessage = async (from, quoted, text) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, text, MessageType.extendedText, { quoted, contextInfo: { mentionedJid: members } })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} buffer 
     */
    hideTagImage = async (from, buffer) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, buffer, MessageType.image, { contextInfo: { mentionedJid: members } })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} buffer 
     */
    hideTagSticker = async (from, buffer) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, buffer, MessageType.sticker, { contextInfo: { mentionedJid: members } })
    }
    /**
     * 
     * @param {string} from 
     * @param {string|number} nomor 
     * @param {string} nama 
     */
    hideTagContact = async (from, nomor, nama) => {
        let vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:' + nama + '\n' + 'ORG:Kontak\n' + 'TEL;type=CELL;type=VOICE;waid=' + nomor + ':+' + nomor + '\n' + 'END:VCARD'
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, { displayname: nama, vcard: vcard }, MessageType.contact, { contextInfo: { mentionedJid: members } })
    }
    //
    /**
     * 
     * @param {string} id 
     * @returns 
     */
    getInfoGroupMember = async (id) => {
        let members = await this.conn.groupMetadata(id)
        return members.participants
    }
    /**
     * 
     * @param {string} from 
     * @returns 
     */
    getGroupInvitationCode = async (from) => {
        const linkgc = await this.conn.groupInviteCode(from)
        return "https://chat.whatsapp.com/" + linkgc
    }
    /**
     * 
     * @param {string} from 
     */
    getGroupInfo = async (from) => {
        const meta = await this.conn.groupMetadata(from)
        const pict = await this.getProfilePicture(from)
        const members = await this.getGroupParticipants(from)
        const admin = this.getGroupAdmins(meta.participants);
        const buffer = await this.getBuffer(pict);
        const user_pemilik = admin.filter(v => {
            return v.isSuperAdmin
        })[0];
        const name_pemilik = user_pemilik > 0 ? this.getNameUser(user_pemilik) : "SUDAH PERGI DARI GRUP"
        this.conn.sendMessage(from, buffer.result, MessageType.image, {
            contextInfo: { mentionedJid: members },
            caption: this.templateFormat("INFO GRUP", [
                this.templateItemVariable("NAMA", meta.subject),
                this.templateItemVariable("PEMILIK", name_pemilik),
                this.templateItemVariable("MEMBER", meta.participants.length),
                this.templateItemVariable("ADMIN", admin.map(v => {
                    const name = this.getNameUser(v);
                    if (String(name).includes("@")) {
                        return "~> " + String(name).split("@")[0]
                    } else {
                        return "~> " + this.getNameUser(v)
                    }
                }).join("\n"), true),
                this.templateItemVariable("DESKRIPSI", meta.desc, true),
                this.templateItemVariable("LINK", await this.getGroupInvitationCode(from)),
            ]),
        });
    }
    /**
     * 
     * @param {*} chat 
     * @returns 
     */
    getUserMeta = async (chat) => {
        const group_meta = await this.conn.groupMetadata(chat.key.remoteJid);
        return group_meta.participants.filter(v => {
            return v.jid === chat.participant;
        })[0];
    }
    /**
     * 
     * @param {string} from 
     * @param {array} target 
     */
    kickGroupMember = async (from, target = []) => {
        const group = await this.conn.groupMetadata(from)
        const owner = group.owner.replace("c.us", "s.whatsapp.net")
        const me = this.conn.user.jid
        let t;
        for (t of target) {
            if (!t.includes(me) && !t.includes(owner)) {
                await this.conn.groupRemove(from, [this.formatter(t)])
            } else {
                await this.sendMessage(from, owner + " Not Premited!")
                break
            }
        }
    }
    // =================================================================
    // =================================================================
    //// Listen Family
    /**
     *
     * @param {*} value mendapatkan value dari QR agar bisa di lempar menjadi gambar di website
     */
    listenQR = async (value) => {
        this.conn.on("qr", (qr) => {
            // Now, use the 'qr' string to display in QR UI or send somewhere
            value(qr);
        });
    }
    /**
     * 
     * @param {object} client_info jika sudah terkoneksi maka akan mendapatkan informasi tentang client
     */
    listenConnected = async (client_info) => {
        const getPP = async (jid, img_url) => {
            img_url(await this.getProfilePicture(jid))
        }
        const option = this.option;
        await this.conn.on('open', async function () {
            const user = this.user;
            if (option.debug !== undefined) {
                console.log("WhatsApp Connected...");
                console.log('oh hello ' + user.name + ' (' + user.jid + ')')
            }
            await getPP(user.jid, img_url => {
                user.imgUrl = img_url;
                client_info(user);
            });
        });
    }
    /**
     * 
     * @param {function} result mendapatkan jawaban mengapa bisa terputus
     */
    listenDisconnected = async (result) => {
        this.conn.on('close', (why) => {
            result(why)
        });
    }
    /**
     * 
     * @param {function} value mendapatkan info baterai
     */
    listenBattery = async (value) => {
        this.conn.on('CB:action,,battery', json => {
            const batteryLevelStr = json[2][0][1].value
            const batteryChargeStr = json[2][0][1].live
            value({
                level: parseInt(batteryLevelStr),
                charge: batteryChargeStr,
            });
        })
    }
    /**
     * 
     * @param {function} receive 
     */
    listenGroupParticipantsUpdate = async (receive) => {
        await this.conn.on('group-participants-update', async (anu) => {
            try {
                const group_meta = await this.conn.groupMetadata(anu.jid)
                const user_id = anu.participants[0];
                let ppimg;
                try {
                    ppimg = await this.conn.getProfilePicture(`${user_id.split('@')[0]}@c.us`)
                } catch {
                    ppimg = 'https://i0.wp.com/www.gambarunik.id/wp-content/uploads/2019/06/Top-Gambar-Foto-Profil-Kosong-Lucu-Tergokil-.jpg';
                }
                const buff = await this.getBuffer(ppimg)
                if (anu.action == 'add') {
                    if (this.conn.user.jid.split('@')[0] === user_id.split('@')[0]) {
                        await this.conn.sendMessage(group_meta.id, buff.result, MessageType.image, {
                            caption: this.templateFormat("INTRO", [
                                this.templateItemNormal(`Perkenalkan saya adalah BOT WhatsApp yang bernama *${this.option.bot_name}*`),
                                this.templateItemNormal(`jika ingin melihat perintah apa saja yang dapat saya lakukan silahkan ketik *!tutorial* lalu kirim ke grup ini`),
                            ]), contextInfo: { mentionedJid: [user_id] }
                        }).then(async () => {
                            console.log("Diundang ke grup...");
                        })
                    } else {
                        if (await checkGroupVerify(group_meta.id)) {
                            await this.conn.sendMessage(group_meta.id, buff.result, MessageType.image, {
                                caption: this.templateFormat("SELAMAT DATANG", [
                                    this.templateItemNormal(`@${user_id.split('@')[0]} *JOIN DULU!!!*`),
                                    this.templateItemNormal(`Jika Anda Tidak Mau JOIN Silahkan Keluar Saja`),
                                ]), contextInfo: { mentionedJid: [user_id] }
                            }).then(async () => {
                                await this.conn.sendMessage(group_meta.id, `!join\nnama panjang\nuniversitas\nnama kelas`, MessageType.text, {
                                    contextInfo: { mentionedJid: [user_id] }
                                }).then(() => {
                                    console.log("Welcome...");
                                })
                            })
                        } else {
                            await this.conn.sendMessage(group_meta.id, buff.result, MessageType.image, {
                                caption: this.templateFormat("SELAMAT DATANG", [
                                    this.templateItemNormal(`@${user_id.split('@')[0]} selamat bergabung di grup *${group_meta.subject}*`),
                                ]), contextInfo: { mentionedJid: [user_id] }
                            }).then(async () => {
                                console.log("Diundang ke grup...");
                            })
                        }
                    }
                } else if (anu.action == 'remove') {
                    await this.conn.sendMessage(group_meta.id, buff.result, MessageType.image, {
                        caption: this.templateFormat("KELUAR GRUP", [
                            this.templateItemNormal(`@${user_id.split('@')[0]} hati-hati dijalan :')`),
                        ]), contextInfo: { mentionedJid: [user_id] }
                    })
                } else if (anu.action == 'promote') {
                    await this.conn.sendMessage(group_meta.id, buff.result, MessageType.image, {
                        caption: this.templateFormat("BOT SEKARANG ADMIN", [
                            this.templateItemNormal(`Terimakasih admin telah menjadikan BOT ini menjadi admin di grup ini`),
                        ]), contextInfo: { mentionedJid: [user_id] }
                    }).then(async () => {
                        console.log("dijadikan admin di dalam grup...");
                    })
                } else if (anu.action == 'demote') {
                    await this.conn.sendMessage(group_meta.id, buff.result, MessageType.image, {
                        caption: this.templateFormat("BOT BUKAN ADMIN LAGI", [
                            this.templateItemNormal(`Terimakasih sebelumnya untuk kepercayaan admin telah membuat BOT menjadi admin`),
                        ]), contextInfo: { mentionedJid: [user_id] }
                    }).then(async () => {
                        console.log("dicopot dari admin di dalam grup...");
                    })
                }
            } catch (error) {
                console.log('Error : ', { error })
            }
            receive(anu)
        })
    }
    /**
     * 
     * @param {function} receive mendengarkan semua pesan masuk
     */
    listenMessage = async (receive) => {
        /**
         * The universal event for anything that happens
         * New messages, updated messages, read & delivered messages, participants typing etc.
         */
        await this.conn.on("chat-update", async (ct) => {
            let chat = ct;
            if (chat.presences) {
                // receive presence updates -- composing, available, etc.
                Object.values(chat.presences).forEach((presence) =>
                    console.log(
                        `${presence.name}'s presence is ${presence.lastKnownPresence} in ${chat.jid}`
                    )
                );
            }

            const {
                text,
                extendedText,
                contact,
                location,
                liveLocation,
                image,
                video,
                sticker,
                document,
                audio,
                product,
                buttonsMessage,
            } = MessageType;

            // console.log({ chat });
            if (!chat.hasNewMessage) return;
            if (chat.key && chat.key.remoteJid === "status@broadcast") return; // negate status
            chat = JSON.parse(JSON.stringify(chat)).messages[0];
            if (!chat.message) return;
            if (chat.key.fromMe) return;

            const from = chat.key.remoteJid;
            const content = JSON.stringify(chat.message);
            const type = Object.keys(chat.message)[0];
            const isMedia = type === image || type === video;
            const isQuotedImage = type === extendedText && content.includes(image);
            const isQuotedVideo = type === extendedText && content.includes(video);
            const isQuotedSticker = type === extendedText && content.includes(sticker);
            const isGroup = from.endsWith("@g.us");

            // ====================================================================
            const message_prefix = type === text && chat.message.conversation.startsWith(this.prefix) ?
                chat.message.conversation : type === image && chat.message.imageMessage.caption !== undefined && chat.message.imageMessage.caption.startsWith(this.prefix) ?
                    chat.message.imageMessage.caption : type === video && chat.message.videoMessage.caption !== undefined && chat.message.videoMessage.caption.startsWith(this.prefix) ?
                        chat.message.videoMessage.caption : type === extendedText && chat.message.extendedTextMessage.text.startsWith(this.prefix) ?
                            chat.message.extendedTextMessage.text : type === "buttonsResponseMessage" ?
                                chat.message.buttonsResponseMessage.selectedDisplayText : type === "listResponseMessage" ?
                                    chat.message.listResponseMessage.title : null
            // ====================================================================
            let message = type === text ?
                chat.message.conversation : type === extendedText ?
                    chat.message.extendedTextMessage.text : type === contact ?
                        chat.message.contactMessage : type === "listResponseMessage" ?
                            chat.message.listResponseMessage.title : ""
            message = String(message).startsWith(this.prefix) ? null : message;
            // console.log({ message_prefix, message, type, pointer: chat.message });

            // ====================================================================
            let link = type === text && chat.message.conversation ?
                chat.message.conversation :
                type === image && chat.message.imageMessage.caption ?
                    chat.message.imageMessage.caption :
                    type === video && chat.message.videoMessage.caption ?
                        chat.message.videoMessage.caption :
                        type === extendedText && chat.message.extendedTextMessage.text ?
                            chat.message.extendedTextMessage.text : "";
            const messagesLink = link.slice(0)
                .trim()
                .split(/ +/)
                .shift()
                .toLowerCase();
            // ====================================================================
            const command = String(message_prefix !== null ? message_prefix.slice(0).trim().split(/ +/).shift().toLowerCase() : "").toLowerCase();
            const args = message && typeof message !== "object"
                ? message.trim().split(/ +/).slice(1)
                : message_prefix !== null ? message_prefix.trim().split(/ +/).slice(1) : null;
            const far = args !== null ? args.join(" ") : null;
            const isCmd = message && typeof message !== "object"
                ? message.startsWith(this.prefix)
                : message_prefix !== null ? message_prefix.startsWith(this.prefix) : false;

            const ownerNumber = this.owner.map(nomor => {
                return this.formatter(nomor, "@s.whatsapp.net");
            });

            const user_id = isGroup ? chat.participant : chat.key.remoteJid;
            const botNumber = this.conn.user.jid;

            const totalchat = await this.conn.chats.all();
            const pushname = this.conn.contacts[user_id] != undefined ?
                this.conn.contacts[user_id].vname || this.conn.contacts[user_id].notify : undefined;

            // group meta
            const groupMetadata = isGroup ? await this.conn.groupMetadata(from) : null;
            const groupName = isGroup ? groupMetadata.subject : null;
            const groupId = isGroup ? groupMetadata.id : null;
            const groupMembers = isGroup ? groupMetadata.participants : null;
            const groupDesc = isGroup ? groupMetadata.desc : null;
            const groupAdmins = isGroup ? this.getGroupAdmins(groupMembers).map(v => {
                return v.jid;
            }) : [];
            const isBotGroupAdmins = groupAdmins.includes(botNumber) || false
            const isGroupAdmins = groupAdmins.includes(user_id) || false

            const fungsi = {
                // ===============================================================================================
                // sending method
                /**
                 * 
                 * @param {string} message 
                 * @param {function} onSuccess 
                 * @param {function} onError 
                 */
                sendMessage: async (message, onSuccess = false, onError = false) => {
                    await this.sendMessage(from, message, (result) => {
                        if (onSuccess) onSuccess(result);
                    }, () => {
                        if (onError) onError();
                    })
                },
                /**
                 * 
                 * @param {string} message 
                 * @param {function} onSuccess 
                 */
                reply: async (message, onSuccess = false) => {
                    await this.reply(from, message, text, chat, (result) => {
                        if (onSuccess) onSuccess(result);
                    });
                },
                // ===============================================================================================
                // error message
                perintah_tidak_tersedia: async () => {
                    await fungsi.reply(`maaf, perintah *${command}* tidak tersedia !!`, () => {
                        console.log("wrong, command!");
                    });
                },
                /**
                 * 
                 * @param {string} error 
                 */
                send_error: async (error) => {
                    await fungsi.reply("_*oh noo...*_ : " + error, () => {
                        console.error({ error });
                    });
                },
                // ===============================================================================================
                // only
                only_personal: async () => {
                    await fungsi.reply(`maaf, perintah hanya bisa dilakukan pada personal chat!`, () => {
                        console.log("personal chat only!");
                    });
                },
                only_group: async () => {
                    await fungsi.reply(`maaf, perintah hanya bisa dilakukan pada group chat!`, () => {
                        console.log("group chat only!");
                    });
                },
                only_personal: async () => {
                    await fungsi.reply(`maaf, perintah hanya bisa dilakukan pada personal chat!`, () => {
                        console.log("personal chat only!");
                    });
                },
                only_group: async () => {
                    if (isGroup)
                        await fungsi.reply(`maaf, perintah hanya bisa dilakukan pada group chat!`, () => {
                            console.log("group chat only!");
                        });
                },
                // ===============================================================================================
                // validation
                /**
                 * 
                 * @param {function} lolos 
                 */
                only_admin: async (lolos) => {
                    if (isGroupAdmins) {
                        lolos();
                    } else {
                        await fungsi.reply(`maaf, perintah hanya bisa dilakukan oleh admin !!`, () => {
                            console.log("wrong , other user use command!");
                        });
                    }
                },
                // ===============================================================================================
                // presences
                chatRead: async () => {
                    await this.chatRead(from);
                },
                // ===============================================================================================
                tts: async () => {
                    if (command === this.prefix + "tts") {
                        if (isGroup) {
                            const lang = args[0];
                            if (lang === "list") {
                                await fungsi.chatRead();
                                await this.sendListLangTTS(from, text, chat, () => {
                                    console.log("list language TTS...");
                                });
                            } else {
                                const text = args.filter((v, i) => {
                                    return i > 0
                                }).join(" ");
                                await this.sendTTS(from, chat, lang, text, async (error) => {
                                    await fungsi.chatRead();
                                    await fungsi.reply(error, () => {
                                        console.log("language not available!");
                                    });
                                }, () => {
                                    console.log("send TTS OK!");
                                });
                            }
                        } else {
                            await fungsi.only_group();
                        }
                    }
                },
                // ===============================================================================================
                //// Extra Response
                p: async () => {
                    if ([
                        "p",
                    ].some(v => String(message).toLowerCase() === v)) {
                        await fungsi.chatRead();
                        await fungsi.reply("budayakan mengucapkan salam...");
                    }
                },
                salam: async () => {
                    if ([
                        "assala",
                        "asala",
                    ].some(v => String(message).toLowerCase().startsWith(v))) {
                        await fungsi.chatRead();
                        const user_join = global.join ? global.join.filter(v => {
                            return String(v.number).split("@")[0] === String(chat.participant).split("@")[0];
                        }) : [];
                        await fungsi.chatRead();
                        if (user_join.length > 0) {
                            await this.sendTTS(from, chat, "ms", "wa'alaikumsalam warahmatullahi wabarakatu ya " + user_join[0].name);
                        } else {
                            try {
                                const group_meta = await this.conn.groupMetadata(from)
                                const user_meta = chat.key.fromMe ? this.conn.user : group_meta.participants.filter(v => {
                                    return v.jid === chat.participant;
                                })[0];
                                const get_name = user_meta.notify || user_meta.vname || false;
                                if (get_name) {
                                    await this.sendTTS(from, chat, "ms", "wa'alaikumsalam warahmatullahi wabarakatu ya " + get_name);
                                } else {
                                    await this.sendTTS(from, chat, "ar", "wa'alaikumsalam warahmatullahi wabarakatu");
                                }
                            } catch (error) {
                                await this.sendTTS(from, chat, "ar", "wa'alaikumsalam warahmatullahi wabarakatu");
                            }
                        }
                    }
                },
                greetings: async () => {
                    const list = [
                        "halo", "hallo",
                        "helo", "hello",
                        "hi ", "hy ",
                        "hai", "hay",
                        "woi", "woy", "woey",
                    ]
                    if (list.some(v => String(message).toLowerCase().startsWith(v))) {
                        const intro = String(message).split(" ")[0];
                        await fungsi.chatRead();
                        await fungsi.reply(intro + " juga...");
                    }
                },
                // ===============================================================================================
                //// testing zone
                inject: async () => {
                    if (command === this.prefix + "inject") {
                        const inject = far;
                        const emot = emoji.find(inject)
                        await fungsi.reply(JSON.stringify({
                            inject,
                            emot,
                        }), () => {
                            console.log("resend...");
                        })
                    }
                },
                test: async () => {
                    if (command === this.prefix + "test") {
                        if (!isGroup) {

                        }
                    }
                },
                // ===============================================================================================
            }

            receive({
                ...fungsi,
                // system info
                botNumber,
                ownerNumber,
                // group manage
                groupMetadata,
                groupName,
                groupId,
                groupMembers,
                groupDesc,
                groupAdmins,
                isBotGroupAdmins,
                isGroupAdmins,
                // message manage
                from,
                user_id,
                //
                totalchat,
                chat,
                type,
                isGroup,
                pushname,
                message_prefix,
                message,
                link,
                messagesLink,
                command,
                args,
                far,
                isCmd,
                isMedia,
                isQuotedImage,
                isQuotedVideo,
                isQuotedSticker,
            });
        });
    }
    listenBlocklist = () => {
        this.conn.on('CB:Blocklist', json => {
            if (this.blocked.length > 0) return
            for (let i of json[1].blocklist) {
                this.blocked.push(i.replace('c.us', 's.whatsapp.net'))
            }
        })
    }
    // ==================================================================
    //// Function Family
    /**
     * 
     * @param {string} from 
     */
    chatRead = async (from) => {
        await this.conn.chatRead(this.formatter(from, "@s.whatsapp.net"));
    }
    // ==================================================================
    //// Sender Family
    /**
     * 
     * @param {String|Number} from 
     * @param {String} message 
     * @param {function} terkirim
     * @param {function} gagal_mengirim
     */
    sendMessage = async (from, message, terkirim = false, gagal_mengirim = false) => {
        await this.conn.sendMessage(this.formatter(from), message, MessageType.text).then((result) => {
            if (terkirim)
                terkirim(result);
        }).catch(error => {
            if (gagal_mengirim)
                gagal_mengirim(error);
        })
    }
    /**
     * 
     * @param {string} from 
     * @param {string} message 
     * @param {*} type 
     * @param {*} chat 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    reply = async (from, message, type, chat, onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, message, type, { quoted: chat })
            .then((result) => {
                if (onSuccess) onSuccess(result);
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {*} chat primary message
     * @param {string} message content text
     * @param {function} onSuccess
     * @param {function} onError
     */
    replyWithPictureAndQuote = async (chat, message, onSuccess = false, onError = false) => {
        const group_id = chat.key.remoteJid;
        const sender = chat.participant;
        const imgUrl = await this.getProfilePicture(sender);
        const buffer = await this.getBuffer(imgUrl)
        this.conn.sendMessage(group_id, buffer.result, MessageType.image, {
            caption: message,
            quoted: chat,
        }).then(() => {
            if (onSuccess)
                onSuccess()
        }).catch((error) => {
            console.log({ error });
            if (onError)
                onError()
        })
    }
    /**
     * 
     * @param {*} chat 
     * @param {string} message 
     * @param {{}} buttonSetup 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    replyWithPictureQuoteButton = async (chat, message, buttonSetup, onSuccess = false, onError = false) => {
        const group_id = chat.key.remoteJid;
        const sender = chat.participant;
        const imgUrl = await this.getProfilePicture(sender);
        const buffer = await this.getBuffer(imgUrl)
        this.conn.sendMessage(group_id, buffer.result, MessageType.image, {
            caption: message,
            quoted: chat,
        })
            .then(async () => {
                await this.sendButton(group_id, chat, buttonSetup.message, buttonSetup.footer, buttonSetup.button, () => {
                    if (onSuccess)
                        onSuccess();
                })
            })
            .catch((error) => {
                if (onError)
                    onError(error)
            })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} chat 
     * @param {string} description 
     * @param {{}} buttonText 
     * @param {*} sections 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendList = async (from, chat, description, buttonText, sections, onSuccess = false, onError = false) => {
        const button = {
            buttonText,
            description,
            sections: sections,
            listType: 1
        }
        await this.conn.sendMessage(from, button, MessageType.listMessage, { quoted: chat })
            .then(() => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                console.log({ error });
                if (onError)
                    onError(error)
            })
    }
    /**
     * 
     * @param {String|Number} from 
     * @param {String} message 
     * @param {String} footer 
     * @param {Array} array_button 
     * @param {function} onSuccess
     */
    sendButton = async (from, chat, message, footer, array_buttons, onSuccess = false) => {
        // send a buttons message!
        const buttons = array_buttons.map(v => {
            return { buttonId: 'id_' + String(v).toLowerCase().replace(/\ /g, '_'), buttonText: { displayText: v }, type: 1 }
        })
        const buttonMessage = {
            contentText: message,
            footerText: footer,
            buttons: buttons,
            headerType: 1
        }
        await this.conn.sendMessage(this.formatter(from), buttonMessage, MessageType.buttonsMessage, { quoted: chat }).then(() => {
            if (onSuccess)
                onSuccess();
        })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} chat 
     * @param {string} audio_location 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendAudio = async (from, chat, audio_location, onSuccess = false, onError = false) => {
        await this.conn.sendMessage(this.formatter(from), { url: audio_location }, MessageType.audio, { mimetype: Mimetype.mp4Audio, quoted: chat })
            .then(async () => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} buffer 
     * @param {*} chat 
     * @param {string} caption 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendImage = async (from, buffer, chat, caption = "", onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, buffer, MessageType.image, { caption: caption, quoted: chat })
            .then(async () => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} buffer 
     * @param {*} chat 
     * @param {string} caption 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendVideo = async (from, buffer, chat, caption = "", onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, buffer, MessageType.video, { caption: caption, quoted: chat })
            .then(() => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} buffer 
     * @param {*} chat 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendSticker = async (from, buffer, chat, onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, buffer, MessageType.sticker, { quoted: chat })
            .then(() => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} buffer 
     * @param {string} title 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendPdf = async (from, buffer, title = "myDocument.pdf", onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, buffer, MessageType.document, { mimetype: Mimetype.pdf, title: title })
            .then(() => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {string} from 
     * @param {*} buffer 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendGif = async (from, buffer, onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, buffer, MessageType.video, { mimetype: Mimetype.gif })
            .then(() => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {string} from 
     * @param {string} nomor 
     * @param {string} nama 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendContact = async (from, nomor, nama, onSuccess = false, onError = false) => {
        const vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:' + nama + '\n' + 'ORG:Kontak\n' + 'TEL;type=CELL;type=VOICE;waid=' + nomor + ':+' + nomor + '\n' + 'END:VCARD'
        await this.conn.sendMessage(from, { displayname: nama, vcard: vcard }, MessageType.contact)
            .then(() => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }

    // =================================================================
    //// Define Requirements
    available_lang = [
        { af: "Afrikaans" }, { sq: "Albanian" }, { ar: "Arabic" },
        { hy: "Armenian" }, { bn: "Bangladesh" }, { bs: "Bosnian" },
        { bg: "Bulgarian" }, { ca: "Spain" }, { zh: "Mandarin" },
        { hr: "Croatian" }, { cs: "Czech" }, { da: "Denmark" },
        { nl: "Netherlands" }, { en: "English" }, { et: "Estonian" },
        { fi: "Finland" }, { fr: "France" }, { de: "Germany" },
        { el: "Greece" }, { gu: "Gujarati" }, { hi: "Hindi" },
        { hu: "Hungarian" }, { is: "Iceland" }, { id: "Indonesia" },
        { it: "Italian" }, { ja: "Japanese" }, { kn: "Kannada" },
        { km: "Cambodia" }, { ko: "South Korea" }, { lv: "Latvian" },
        { mk: "Macedonian" }, { ms: "Malaysia" }, { ml: "Malayalam" },
        { mr: "Marathi" }, { ne: "Nepal" }, { no: "Norwegian" },
        { pl: "Poland" }, { pt: "Portuguese" }, { ro: "Romanian" },
        { ru: "Russian" }, { sr: "Serbian" }, { si: "Sri Lanka" },
        { sk: "Slovakia" }, { es: "Spanish" }, { su: "Sundanese" },
        { sw: "Swahili" }, { sv: "Swedish" }, { ta: "Tamil" },
        { te: "Telugu" }, { th: "Thailand" }, { tr: "Turkey" },
        { uk: "Ukrainian" }, { ur: "Urdu" }, { vi: "Vietnamese" },
    ];
    /**
     * 
     * @param {string} from 
     * @param {string} text 
     * @param {*} chat 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendListLangTTS = async (from, text, chat, onSuccess = false, onError = false) => {
        const inject = this.available_lang.map(lang => {
            return this.templateItemVariable(Object.keys(lang), Object.values(lang))
        });
        await this.reply(from, this.templateFormat("Speech Language Available", [
            ...inject,
        ]), text, chat, () => {
            if (onSuccess) onSuccess();
        }, () => {
            if (onError) onError();
        })
    }
    // =================================================================
    //// Addon
    /**
     *
     * @param {String} lang
     * @param {String} text_speech
     * @param {String} mp3_path
     * @param {function} lang_not_available
     */
    getTTS = async (lang, text_speech, mp3_path, lang_not_available = false) => {
        const only_key = this.available_lang.map((v) => {
            return Object.keys(v)[0];
        });
        if (only_key.some((available) => {
            return available === lang;
        })) {
            try {
                await googleTTS
                    .getAudioBase64(text_speech, { lang, slow: false })
                    .then((base64) => {
                        // save the audio file
                        const buffer = Buffer.from(base64, "base64");
                        const ran = generateRandomString();
                        const locationSave = path.join(__dirname, "..", "temp", ran + ".mp3");
                        fs.writeFile(locationSave, buffer, { encoding: "base64" }, () => {
                            mp3_path(locationSave);
                        });
                    })
                    .catch((error) => {
                        console.error(error);
                        if (lang_not_available) lang_not_available(error);
                    });
            } catch (error) {
                if (lang_not_available) lang_not_available(error);
            }
        } else {
            if (lang_not_available) lang_not_available(`maaf, untuk kode bahasa *${lang}* tidak tersedia!`);
        }
    }
    /**
     * 
     * @param {string} from 
     * @param {*} chat 
     * @param {string} lang 
     * @param {string} text_speech 
     * @param {function} lang_not_available 
     * @param {function} onSuccess 
     * @param {function} onError 
     */
    sendTTS = async (from, chat, lang, text_speech, lang_not_available = false, onSuccess = false, onError = false) => {
        const lower_lang = String(lang).toLowerCase();
        await this.getTTS(lower_lang, text_speech, (mp3_path) => {
            this.sendAudio(from, chat, mp3_path, () => {
                this.deleteFile(mp3_path, () => {
                    if (onSuccess) onSuccess();
                });
            }, () => {
                if (onError) onError();
            });
        }, (error) => {
            if (lang_not_available) lang_not_available(error);
        });
    }
    // ==================================================================
    //// Function for Backend
    /**
     * 
     * @param {string} from 
     * @param {*} res 
     */
    sendOTP = async (from, res) => {
        await this.isRegisteredUser(from, () => {
            const otp = generateRandomOTP()
            this.sendMessage(this.formatter(from, "@s.whatsapp.net"), this.templateFormat("OTP", [
                this.templateItemVariable("Kode OTP", otp),
                this.templateItemNormal(`_*jangan bagikan kode OTP ini ke orang lain*_`),
            ]), MessageType.text)
                .then(() => {
                    res.status(200).json({
                        status: true,
                        message: "berhasil mengirimkan OTP",
                        otp,
                    });
                })
                .catch(() => {
                    res.status(500).json({
                        status: false,
                        message: "gagal mengirimkan OTP",
                    })
                })
        }, () => {
            res.status(400).json({
                status: false,
                message: "nomer whatsapp tidak terdaftar",
            })
        })
    }
}

module.exports = WhatsApp;
