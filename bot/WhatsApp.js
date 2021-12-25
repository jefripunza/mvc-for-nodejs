// ============================== 1st ==============================
const fs = require("fs");
const path = require('path');
const { exec } = require('child_process');

const {
    generateRandomString,
    generateRandomOTP,
} = require("../helpers/generate")

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
        this.SESSION_NAME = path.join(__dirname, "session", SESSION_NAME);
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
    check_version = async () => {
        const check = await this.fetchJson("https://web.whatsapp.com/check-update?version=1&platform=web")
        return String(check.currentVersion).split(".").map(v => {
            return parseInt(v)
        });
    }
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
    // =============================== DEFINE ===============================
    blocked = []
    // =============================== FUNCTION ===============================
    isArray(value) {
        return typeof value === "object" && Array.isArray(value) && value !== null;
    }
    isObject(value) {
        return typeof value === "object" && !Array.isArray(value) && value !== null;
    }
    temp(filename) {
        const tempDir = path.join(__dirname, "..", "Temp")
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
            console.log('Temp Directory Created Successfully.');
        }
        return path.join(tempDir, filename)
    }
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    getRandomFile = (ext) => {
        return generateRandomString() + "." + ext;
    }

    formatter(number, standard = "@c.us") {
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
    detikKeWaktu(seconds) {
        function pad(s) {
            return (s < 10 ? '0' : '') + s;
        }
        var hours = Math.floor(seconds / (60 * 60));
        var minutes = Math.floor(seconds % (60 * 60) / 60);
        var seconds = Math.floor(seconds % 60);
        return `${pad(hours)} Jam ${pad(minutes)} Menit ${pad(seconds)} Detik`
    }
    uptime() {
        const uptime = process.uptime()
        return this.detikKeWaktu(uptime)
    }
    async systemPing(host, ping) {
        try {
            await exec(`ping ${host} -n 1`, (error, stdout, stderr) => {
                ping(
                    String(stdout)
                    // .split("\n")[7]
                    // .split("Min")[1]
                    // .split(", ")
                    // .map((v, i) => {
                    //     if (i === 0) {
                    //         return "Min" + v
                    //     }
                    //     return v
                    // })
                    // .map(v => {
                    //     const data = String(v).replace("\r", "").split(" = ")
                    //     return {
                    //         [data[0]]: data[1],
                    //     }
                    // })
                )
            });
        } catch (error) {
            console.error(error)
        }
    }
    // =============================== FUNCTION WHATSAPP ===============================
    /**
     * 
     * @param {String|Number} from 
     * @param {*} isTrue callback
     * @param {*} isNotFound callback
     */
    async isRegisteredUser(from, isTrue, isNotFound) {
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
     * @param {Callback} value callback
     */
    async getProfilePicture(from) {
        let url;
        try {
            url = await this.conn.getProfilePicture(from);
        } catch {
            url = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
        }
        return url
    }
    getNameUser(member) {
        if (this.conn.user.jid === member.jid) {
            return this.bot_name;
        }
        return member.notify || member.vname || member.jid;
    }
    getGroupAdmins = (participants) => {
        const admins = []
        for (let i of participants) {
            i.isAdmin ? admins.push(i) : ''
        }
        return admins
    }
    async listGroup() {
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
    changeChatGroup = async (group_id, chatOn = true) => {
        await this.conn.groupSettingChange(this.formatter(group_id, "@g.us"), GroupSettingChange.messageSend, chatOn);
    }
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
    hideTag = async (from, text) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, text, MessageType.text, { contextInfo: { mentionedJid: members } })
    }
    hideTagWithMessage = async (from, quoted, text) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, text, MessageType.extendedText, { quoted, contextInfo: { mentionedJid: members } })
    }
    hideTagImage = async (from, buffer) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, buffer, MessageType.image, { contextInfo: { mentionedJid: members } })
    }
    hideTagSticker = async (from, buffer) => {
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, buffer, MessageType.sticker, { contextInfo: { mentionedJid: members } })
    }
    hideTagContact = async (from, nomor, nama) => {
        let vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:' + nama + '\n' + 'ORG:Kontak\n' + 'TEL;type=CELL;type=VOICE;waid=' + nomor + ':+' + nomor + '\n' + 'END:VCARD'
        let members = await this.getGroupParticipants(from)
        await this.conn.sendMessage(from, { displayname: nama, vcard: vcard }, MessageType.contact, { contextInfo: { mentionedJid: members } })
    }
    //
    getInfoGroupMember = async (id) => {
        let members = await this.conn.groupMetadata(id)
        return members.participants
    }
    getGroupInvitationCode = async (from) => {
        const linkgc = await this.conn.groupInviteCode(from)
        return "https://chat.whatsapp.com/" + linkgc
    }
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
    async getUserMeta(chat) {
        const group_meta = await this.conn.groupMetadata(chat.key.remoteJid);
        return group_meta.participants.filter(v => {
            return v.jid === chat.participant;
        })[0];
    }
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
    ////////
    // hidden
    async deleteSession(onSuccess) {
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
    reconnect() {
        this.conn.connect(); // reconnect
    }
    /**
     * 
     * @param {callback} onSuccess ketika selesai logout
     */
    logout(onSuccess) {
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
    templateItemNormal(text, before_enter = false) {
        const value_enter = before_enter ? "\n" : "";
        return `${value_enter}${text}${value_enter}\n`;
    }
    templateItemEnter() {
        return `\n`;
    }
    templateItemSkip() {
        return `  ​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​\n`;
    }
    templateItemVariable(key, value, enter = false) {
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
    templateItemTitle(title, array = false) {
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
    templateItemCommand(title, cmd, note = false) {
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
    templateItemList(key, array, enter = false) {
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
    templateItemNext(text = "") {
        return `│ ${text}\n`;
    }
    templateFormat(title, text_array) {
        const text_inject = text_array.join("");
        return `┌─「 _*${title}*_ 」\n│\n${text_inject}│\n└─「 >> _*${this.bot_name}*_ << 」`;
    }
    // =================================================================
    // =================================================================
    //// Listen Family
    /**
     *
     * @param {*} value mendapatkan value dari QR agar bisa di lempar menjadi gambar di website
     */
    async listenQR(value) {
        this.conn.on("qr", (qr) => {
            // Now, use the 'qr' string to display in QR UI or send somewhere
            value(qr);
        });
    }
    /**
     * 
     * @param {object} client_info jika sudah terkoneksi maka akan mendapatkan informasi tentang client
     */
    async listenConnected(client_info) {
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
     * @param {*} result mendapatkan jawaban mengapa bisa terputus
     */
    listenDisconnected(result) {
        this.conn.on('close', (why) => {
            result(why)
        });
    }
    /**
     * 
     * @param {*} value mendapatkan info baterai
     */
    listenBattery(value) {
        this.conn.on('CB:action,,battery', json => {
            const batteryLevelStr = json[2][0][1].value
            const batteryChargeStr = json[2][0][1].live
            value({
                level: parseInt(batteryLevelStr),
                charge: batteryChargeStr,
            });
        })
    }
    async listenGroupParticipantsUpdate(receive) {
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
    messageLogger = []  //declare a variable to save message
    /**
     * 
     * @param {Object} receive mendengarkan semua pesan masuk
     */
    async listenMessage(receive) {
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

            if (!chat.hasNewMessage) {
                try {
                    if (JSON.parse(JSON.stringify(chat)).messages[0].messageStubType == 'REVOKE') {
                        for (let i = 0; i <= this.messageLogger.length; i++) {
                            if (JSON.parse(JSON.stringify(chat)).messages[0].key.id == this.messageLogger[i].messages[0].key.id) {
                                const deleteHistory = this.messageLogger[i].messages[0];
                                const deleteType = Object.keys(deleteHistory.message)[0]
                                const messageGroupId = deleteHistory.key.remoteJid;
                                const messageUser = deleteHistory.participant;
                                const messagedeleted = deleteType === text ? deleteHistory.message[deleteType]
                                    : deleteType === extendedText ? deleteHistory.message[extendedText].conversation !== undefined ? deleteHistory.message[extendedText].conversation : deleteHistory.message[extendedText].text
                                        : deleteType === video ? deleteHistory.message[video].caption
                                            : deleteType === image ? deleteHistory.message[image].text
                                                : deleteType === "buttonsResponseMessage" ? deleteHistory.message.buttonsResponseMessage.text : null;
                                console.log('A message has been deleted: ', { messageUser, deleteHistory, messagedeleted, message: deleteHistory.message })
                                if (deleteType === image) {
                                    const media = await this.conn.downloadAndSaveMediaMessage(deleteHistory, this.temp(deleteHistory.key.id));
                                    const buffer = await fs.readFileSync(media);
                                    await this.sendImage(messageGroupId, buffer, deleteHistory, this.templateFormat("HAPUS GAMBAR", [
                                        this.templateItemNormal(`@${messageUser.split('@')[0]} : gambar apa hayooo`),
                                    ]), async () => {
                                        await this.deleteFile(media, () => {
                                            console.log("hapus gambar apa hayooo");
                                        })
                                    }, error => {
                                        console.log({ error });
                                    })
                                } else if (deleteType === sticker) {
                                    // 
                                } else if (deleteType === video) {
                                    // 
                                } else if (deleteType === text || deleteType === extendedText) {
                                    if (messageGroupId !== "status@broadcast")
                                        await this.conn.sendMessage(messageGroupId, this.templateFormat("HAPUS PESAN", [
                                            this.templateItemNormal(`@${messageUser.split('@')[0]} : ${messagedeleted}`),
                                        ]), MessageType.text, { contextInfo: { mentionedJid: [messageUser] }, quoted: deleteHistory }).then(() => {
                                            console.log("hayoo hapus apa anda...");
                                        })
                                }
                            }
                        }
                    }
                } catch { }
                return
            } else {
                this.messageLogger.push(JSON.parse(JSON.stringify(chat)))
            }

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

            // tutorial field
            const tutorial_standard = [];
            const tutorial_addon = [];
            const tutorial_extra_response = [];
            const tutorial_testing = [];

            const fungsi = {
                // ===============================================================================================
                // error message
                perintah_tidak_tersedia: async () => {
                    await fungsi.reply(`maaf, perintah *${command}* tidak tersedia !!`, () => {
                        console.log("wrong, command!");
                    });
                },
                send_error: async (error) => {
                    await fungsi.reply("_*oh noo...*_ : " + error, () => {
                        console.log({ error });
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
                // sending method
                sendMessage: async (message, onSuccess = false, onError = false) => {
                    await this.sendMessage(from, message, () => {
                        if (onSuccess) onSuccess();
                    }, () => {
                        if (onError) onError();
                    })
                },
                reply: async (message, onSuccess = false) => {
                    await this.reply(from, message, text, chat, () => {
                        if (onSuccess) onSuccess();
                    });
                },
                // ===============================================================================================
                //// standard
                ping: async () => {
                    if (isCmd) {
                        if (command === this.prefix + "ping") {
                            const start = speed();
                            const cpu_speed = speed() - start
                            await fungsi.chatRead();
                            await this.systemPing("www.google.com", async ping => {
                                await fungsi.chatRead();
                                console.log({ ping });
                                await fungsi.reply(JSON.stringify({
                                    ping: {
                                        google: ping,
                                    },
                                    cpu_speed,
                                }, null, 2));
                            })
                        }
                    }
                    // =============================================
                    tutorial_standard.push({
                        title: '!ping',
                        description: this.templateItemCommand("Test Internet Server", "*!ping*", [
                            "untuk melihat kecepatan internet server dan speed CPU server",
                        ]),
                        rowId: generateRandomString(),
                    });
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
                    // =============================================
                    tutorial_addon.push({
                        title: '!tts ms ini hanya coba-coba',
                        description: this.templateItemCommand("Text To Speech", "*!tts*  _kode_negara_  _kata_", [
                            "untuk melihat list kode_negara bisa menggunakan perintah *!tts list*"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                tanya: async () => {
                    if (command === this.prefix + "tanya") {
                        console.log("Tanya...");
                        if (isGroup) {
                            console.log("Group...");
                            await brainly(far).then(async res => {
                                console.log("Respon...", { res });
                                if (res.length > 0) {
                                    console.log("Sip...");
                                    const jawaban = [];
                                    for (let i = 0; i < res.data.length; i++) {
                                        const hasil = res.data[i];
                                        jawaban.push(this.templateItemVariable(`Jawaban ${i + 1} `, hasil.jawaban[0].text, true));
                                    }
                                    await this.conn.sendMessage(from, this.templateFormat("ANSWER", [
                                        this.templateItemVariable(`Pertanyaan`, far, true),
                                        ...jawaban,
                                    ]), text, { quoted: chat, detectLinks: false })
                                }
                            });
                        } else {
                            await fungsi.only_group();
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!tanya singkatan dari NKRI adalah',
                        description: this.templateItemCommand("Bertanya", "*!tanya*  _pertanyaan_", [
                            "pertanyaan yang dikirim harus bersifat rasional, jika bertanya hanya untuk ngelawak maka hasilnya pun juga melawak"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                makeSticker: async () => {
                    try {
                        if ([
                            this.prefix + "stiker",
                            this.prefix + "sticker",
                        ].some(v => command === v)) {
                            if (isGroup) {
                                if (isMedia || isQuotedImage || isQuotedVideo) {
                                    try {
                                        const media = await this.conn.downloadAndSaveMediaMessage(isMedia ? chat : JSON.parse(JSON.stringify(chat).replace('quotedM', 'm')).message[type].contextInfo, this.temp(chat.key.id))
                                        const ran = this.temp(this.getRandomFile("webp"));
                                        await ffmpeg(media)
                                            .input(media)
                                            .on('start', function (cmd) {
                                                console.log(`Started : ${cmd}`)
                                            })
                                            .addOutputOptions([
                                                `-vcodec`, `libwebp`,
                                                `-vf`, `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
                                            ])
                                            .toFormat('webp')
                                            .save(ran)
                                            .on('end', async () => {
                                                console.log('Finish')
                                                const buff = await fs.readFileSync(ran)
                                                await this.sendSticker(from, buff, chat);
                                                await fs.unlinkSync(media) // asli
                                                await fs.unlinkSync(ran) // sticker
                                            })
                                            .on('error', async (err) => {
                                                await fungsi.reply(' *𝗠𝗔𝗔𝗙 𝗧𝗘𝗥𝗝𝗔𝗗𝗜 𝗞𝗘𝗦𝗔𝗟𝗔𝗛 𝗦𝗔𝗔𝗧 𝗖𝗢𝗡𝗩𝗘𝗥𝗧 𝗧𝗢 𝗦𝗧𝗜𝗖𝗞𝗘𝗥*', () => {
                                                    console.log(`Error : ${err}`)
                                                })
                                                await fs.unlinkSync(media) // asli
                                            })
                                    } catch (error) {
                                        console.log("neng kono...", { error });
                                    }
                                } else {
                                    await fungsi.send_error("harus disertakan _gambar/video/gif_,\nuntuk lebih jelas ketik *!tutorial*")
                                }
                            } else {
                                await fungsi.only_group();
                            }
                        }
                    } catch (error) {
                        await fungsi.send_error(error);
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!stiker',
                        description: this.templateItemCommand("Buat Stiker", "*!sticker*", [
                            "media : foto, video pendek, gif",
                            "boleh juga *!stiker*",
                            "perintah ditulis disebelum kirim media atau bisa juga dengan tag media yang sudah terkirim dengan perintah tersebut"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                ytdl: async () => {
                    if (isGroup) {
                        if (command === this.prefix + "ytdl") {
                            const ytIdRegex = /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)([-_0-9A-Za-z]{11})/
                            if (ytIdRegex.test(args[0])) {
                                const youtube = await this.getYoutubeInfo(args[0])
                                const {
                                    _status,
                                    success,
                                    message,
                                    response,
                                } = youtube;
                                if (_status === 200) {
                                    if (success) {
                                        const buffer = await this.getBuffer(response.thumbnail)
                                        await this.sendImage(from, buffer.result, chat, this.templateFormat("YOUTUBE DOWNLOAD", [
                                            this.templateItemVariable("Judul", response.title),
                                            this.templateItemVariable("Channel", response.channel),
                                            this.templateItemVariable("Kualitas", String(response.video.format).split(" - ")[1]),
                                            this.templateItemVariable("Size", response.video.size + ` (${response.video.ext})`),
                                            this.templateItemList("Cara Download", [
                                                this.templateItemNormal("klik *Baca selengkapnya* agar link terlihat keseluruhan"),
                                                this.templateItemNormal("buka link *Streaming*"),
                                                this.templateItemNormal("klik *tombol titik 3* pada video kanan bawah"),
                                                this.templateItemNormal("klik *Download*"),
                                            ], true),
                                            this.templateItemVariable("Streaming", response.video.url),
                                        ]))
                                            .then(async () => {
                                                console.log("DONE...");
                                            })
                                            .catch((error) => {
                                                console.log("Error... : ", { error });
                                            })
                                    } else {
                                        await fungsi.reply(message)
                                    }
                                } else {
                                    await fungsi.reply(message)
                                }
                            } else {
                                await fungsi.reply("maaf, format link tidak benar!", () => {
                                    console.log("wrong, link youtube...");
                                })
                            }
                        }
                    } else {
                        await fungsi.only_group();
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!ytdl https://www.youtube.com/watch?v=9We3pS6aqvA',
                        description: this.templateItemCommand("Youtube Download", "*!ytdl*  _link_video_youtube_", [
                            "tools satu ini sangatlah epic karena kita bisa mendownload video youtube hanya dengan WhatsApp",
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                ytmp3: async () => {
                    if (command === this.prefix + "ytmp3") {
                        if (isGroup) {
                            const ytmp3 = await this.fetchJson(`https://api.zeks.me/api/ytmp3?url=${args[0]}&apikey=${zeks_api}`);
                            const {
                                _status,
                                status,
                                result,
                                message,
                            } = ytmp3;
                            if (_status === 200 && status) {
                                const buffer = await this.getBuffer(result.thumbnail)
                                await this.sendImage(from, buffer.result, chat, this.templateFormat("YOUTUBE MP3", [
                                    this.templateItemVariable("Judul", result.title),
                                    // this.templateItemVariable("Size", result.size),
                                    this.templateItemVariable("Download", result.url_audio),
                                ]))
                                    .then(async () => {
                                        console.log("DONE...");
                                    })
                                    .catch((error) => {
                                        console.log("Error... : ", { error });
                                    })
                            } else {
                                await fungsi.reply(message)
                            }
                        } else {
                            await fungsi.only_group();
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!ytmp3 https://www.youtube.com/watch?v=9We3pS6aqvA',
                        description: this.templateItemCommand("Youtube MP3", "*!ytmp3*  _link_video_youtube_", [
                            "bisa mendownload MP3 dari sebuah link youtube",
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                // ===========================================================================
                //// Addon => API Family (extra)
                meme: async () => {
                    if (command === this.prefix + "meme") {
                        const meme = await this.fetchJson(`https://api.zeks.me/api/memeindo?apikey=${zeks_api}`);
                        const {
                            _status,
                            status,
                            result,
                            message,
                        } = meme;
                        if (_status === 200 && status) {
                            const buff = await this.getBuffer(result);
                            await this.sendImage(from, buff.result, chat, "semoga terhibur...", () => {
                                console.log("send meme...");
                            })
                        } else {
                            await fungsi.reply(message);
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!meme',
                        description: this.templateItemCommand("Gambar Meme", "*!meme*", [
                            "mengirimkan gambar meme untuk kebahagiaan pengguna bot"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                resepmasak: async () => {
                    if (command === this.prefix + "resepmasak") {
                        const result = await this.fetchJson(`https://masak-apa.tomorisakura.vercel.app/api/search?q=${far}`)
                        if (result._status) {
                            const masak = []
                            for (let i = 0; i < result.results.length; i++) {
                                const msk = result.results[i];
                                masak.push(this.templateItemList(`> Resep #${i + 1}`, [
                                    this.templateItemNormal("Title : " + msk.title),
                                    this.templateItemNormal("Durasi Masak Sekitar : " + msk.times),
                                    this.templateItemNormal("Porsi : " + msk.serving),
                                    this.templateItemNormal("Tingkat Kesulitan : " + msk.difficulty),
                                    this.templateItemNormal("Link : " + `https://www.masakapahariini.com/resep/${msk.key}`),
                                ]));
                                if (i === 14) break;
                            }
                            await this.conn.sendMessage(from, this.templateFormat("RESEP MASAK", [
                                this.templateItemVariable(`Request`, pushname),
                                this.templateItemEnter(),
                                ...masak,
                            ]), text, { quoted: chat, detectLinks: false })
                        } else {
                            await fungsi.reply(result.message);
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!resepmasak nasi goreng spesial',
                        description: this.templateItemCommand("Resep Masak", "*!resepmasak*  _nama_masakan_", [
                            "mencari resep masak untuk kebutuhan hidup dan perut :v"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                playstore: async () => {
                    if (command === this.prefix + "playstore") {
                        const result = await this.fetchJson(`https://api.zeks.xyz/api/sgplay?apikey=${zeks_api}&q=${far}`)
                        if (result._status) {
                            const playstore = []
                            for (let i = 0; i < result.result.length; i++) {
                                const ps = result.result[i];
                                playstore.push(this.templateItemList(`> Apk #${i + 1}`, [
                                    this.templateItemNormal("Nama : " + ps.title),
                                    this.templateItemNormal("Developer : " + ps.developer),
                                    this.templateItemNormal("Link : " + ps.url),
                                ]));
                                if (i === 2) break;
                            }
                            await this.conn.sendMessage(from, this.templateFormat("PLAYSTORE", [
                                this.templateItemVariable(`Request`, pushname),
                                this.templateItemEnter(),
                                ...playstore,
                            ]), text, { quoted: chat, detectLinks: false })
                        } else {
                            await fungsi.reply(result.message);
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!playstore game burik',
                        description: this.templateItemCommand("Playstore", "*!playstore*  _nama_aplikasi_", [
                            "mencari aplikasi didalam playstore"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                nonton: async () => {
                    if (command === this.prefix + "nonton") {
                        const nonton = await this.fetchJson(`https://api.zeks.me/api/film/2?apikey=${zeks_api}&q=${far}`)
                        const {
                            status,
                            _status,
                            result,
                            message,
                        } = nonton;
                        if (_status === 503) {
                            await fungsi.reply(message)
                        } else if (_status === 200 && status) {
                            const nonton = []
                            for (let i = 0; i < result.length; i++) {
                                const film = result[i];
                                nonton.push(this.templateItemList(`> Film #${i + 1}`, [
                                    this.templateItemNormal("Judul : " + film.title),
                                    this.templateItemNormal("Link : " + film.url),
                                ]));
                            }
                            await this.conn.sendMessage(from, this.templateFormat("NONTON", [
                                this.templateItemVariable(`Request`, pushname),
                                this.templateItemEnter(),
                                ...nonton,
                            ]), text, { quoted: chat, detectLinks: false })
                                .then(async () => {
                                    console.log("DONE...");
                                })
                                .catch((error) => {
                                    console.log("Error... : ", { error });
                                })
                        } else {
                            await fungsi.reply(message)
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!nonton spiderman',
                        description: this.templateItemCommand("Nonton Film", "*!nonton*  _judul_film_", [
                            "mau nonton film apa? silahkan cari karena sekarang sudah tersedia pencarian film dari WhatsApp (masih berupa IP, mau akses tinggal copy paste saja)"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                google: async () => {
                    if (command === this.prefix + "google") {
                        google({ query: far })
                            .then(async (results) => {
                                const inject = []
                                for (let i = 0; i < results.length; i++) {
                                    const result = results[i];
                                    inject.push(this.templateItemList(`> Hasil #${i + 1}`, [
                                        this.templateItemEnter(),
                                        this.templateItemNormal("Judul : " + result.title),
                                        this.templateItemNormal("Deskripsi : " + result.snippet),
                                        this.templateItemNormal("Link : " + result.link),
                                    ]));
                                }
                                await this.conn.sendMessage(from, this.templateFormat("GOOGLE SEARCH", [
                                    this.templateItemVariable(`Request`, pushname),
                                    this.templateItemVariable(`Hasil Pencarian`, far, true),
                                    this.templateItemEnter(),
                                    ...inject,
                                ]), text, { quoted: chat, detectLinks: false })
                            }).catch(async e => {
                                console.log(e)
                                await fungsi.send_error(e)
                            })
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!google cara menjadi pintar',
                        description: this.templateItemCommand("Google Search", "*!google*  _kata_kunci_", [
                            "mencari sesuatu dibrowser>google tidaklah epic, mencari di google menggunakan WhatsApp?"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                alquran: async () => {
                    if (command === this.prefix + "alquran") {
                        const alquran = await this.fetchJson(`https://api.zeks.me/api/quran?no=${args[0]}&apikey=${zeks_api}`);
                        if (alquran._status === 200) {
                            await this.conn.sendMessage(from, this.templateFormat("AL-QURAN", [
                                this.templateItemVariable(`Request`, pushname),
                                this.templateItemEnter(),
                                this.templateItemNormal("Surah : " + alquran.surah),
                                this.templateItemNormal("Diturunkan : " + alquran.type),
                                this.templateItemNormal("Jumlah Ayat : " + alquran.jumlah_ayat),
                                this.templateItemNormal("MP3 : " + alquran.audio),
                                this.templateItemEnter(),
                                this.templateItemNormal("Keterangan : \n" + String(alquran.ket).replace(/<br\s*[\/]?>/gi, "\n")),
                            ]), text, { quoted: chat, detectLinks: false })
                                .then(async () => {
                                    console.log("DONE...");
                                })
                                .catch((error) => {
                                    console.log("Error... : ", { error });
                                })
                        } else {
                            await fungsi.reply(alquran.message)
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!alquran 2',
                        description: this.templateItemCommand("Al-Qur'an", "*!alquran*  _nomor_surat_", [
                            "saatnya mengaji, silahkan masukan nomor surat maka semua info didalam surat sampai MP3 nya akan bot kasih"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                jadwaltv: async () => {
                    if (command === this.prefix + "jadwaltv") {
                        const jadwaltv = await this.fetchJson(`https://docs-jojo.herokuapp.com/api/jadwaltvnow`);
                        if (jadwaltv._status === 200) {
                            await this.conn.sendMessage(from, this.templateFormat("JADWAL TV", [
                                this.templateItemVariable(`Request`, pushname),
                                this.templateItemEnter(),
                                this.templateItemNormal("List : \n\n" + jadwaltv.result.jadwalTV
                                    .split("\n")
                                    .map(v => {
                                        const first = parseInt(String(v)[0])
                                        return Number.isInteger(first) ? v : "\n" + v;
                                    })
                                    .join("\n")
                                ),
                            ]), text, { quoted: chat, detectLinks: false })
                                .then(async () => {
                                    console.log("DONE...");
                                })
                                .catch((error) => {
                                    console.log("Error... : ", { error });
                                })
                        } else {
                            await fungsi.reply(jadwaltv.message)
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!jadwaltv',
                        description: this.templateItemCommand("Jadwal TV", "*!jadwaltv*", [
                            "melihat jadwal tv menggunakan WhatsApp"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                kbbi: async () => {
                    if (command === this.prefix + "kbbi") {
                        const kbbi = await this.fetchJson(`https://mnazria.herokuapp.com/api/kbbi?search=${far}`);
                        if (kbbi._status === 200) {
                            await this.conn.sendMessage(from, this.templateFormat("KAMUS KBBI", [
                                this.templateItemVariable(`Request`, pushname),
                                this.templateItemEnter(),
                                this.templateItemNormal("Hasil : \n\n" + kbbi.result),
                            ]), text, { quoted: chat, detectLinks: false })
                                .then(async () => {
                                    console.log("DONE...");
                                })
                                .catch((error) => {
                                    console.log("Error... : ", { error });
                                })
                        } else {
                            await fungsi.reply(kbbi.message)
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!kbbi mencintai',
                        description: this.templateItemCommand("KBBI", "*!kbbi*  _kata_", [
                            "menemukan arti sebuah kalimat bahasa indonesia menggunakan *kamus besar bahasa indonesia*"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                katacinta: async () => {
                    if (command === this.prefix + "katacinta") {
                        const katacinta = await this.fetchJson(`https://docs-jojo.herokuapp.com/api/katacinta`);
                        if (katacinta._status === 200) {
                            await this.conn.sendMessage(from, this.templateFormat("KATA CINTA (RANDOM)", [
                                this.templateItemVariable(`Request`, pushname),
                                this.templateItemEnter(),
                                this.templateItemNormal("Hasil : \n\n" + katacinta.result),
                            ]), text, { quoted: chat, detectLinks: false })
                                .then(async () => {
                                    console.log("DONE...");
                                })
                                .catch((error) => {
                                    console.log("Error... : ", { error });
                                })
                        } else {
                            await fungsi.reply(katacinta.message)
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!katacinta',
                        description: this.templateItemCommand("KATA CINTA (RANDOM)", "*!katacinta*", [
                            "mendapatkan random kata cinta"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                ig: async () => {
                    if (command === this.prefix + "ig") {
                        const link = args[0];
                        const code = String(link)
                            .split(".com")[1]
                            .split("/")[2]
                        const ig = await this.fetchJson(`${myAPI}/igdl?url=https://www.instagram.com/p/${code}/`);
                        const {
                            _status,
                            message,
                            response,
                        } = ig;
                        if (_status === 200) {
                            const balasan = this.templateFormat("INSTAGRAM DOWNLOADER", [
                                this.templateItemVariable(`Request`, pushname),
                            ])
                            for (let i = 0; i < response.length; i++) {
                                const {
                                    type,
                                    downloadUrl,
                                } = response[i];
                                const buff = await this.getBuffer(downloadUrl);
                                if (type === "video") {
                                    await this.sendVideo(from, buff.result, chat, "", () => {
                                        console.log("DONE...");
                                    })
                                } else if (type === "image") {
                                    await this.sendImage(from, buff.result, chat, "", () => {
                                        console.log("DONE...");
                                    })
                                }
                            }
                            await fungsi.reply(balasan, () => {
                                console.log("instagram download OK...");
                            })
                        } else {
                            await fungsi.reply(message)
                        }
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!ig https://www.instagram.com/p/CVE2ZLdF23N/',
                        description: this.templateItemCommand("Instagram Download", "*!ig*  _url_postingan_", [
                            "mendownload konten instagram (kecuali story)"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                catatan: async () => {
                    if (command === this.prefix + "catatan") {
                        const buff = await this.getBuffer(`https://api.zeks.me/api/nulis?apikey=${zeks_api}&text=${far}`)
                        await this.sendImage(from, buff.result, chat, this.templateFormat("CATATAN", [
                            this.templateItemVariable(`Request`, pushname),
                        ]), () => {
                            console.log("DONE...");
                        });
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!catatan jika A sama dengan 2 dan B sama dengan 3 maka A ditambah B sama dengan 5',
                        description: this.templateItemCommand("Catatan (SIDU)", "*!catatan*  _kalimat_", [
                            "membuat catatan bo'ongan dari buku tulis SIDU"
                        ]),
                        rowId: generateRandomString(),
                    });
                },
                hartatahta: async () => {
                    if (command === this.prefix + "hartatahta") {
                        const buff = await this.getBuffer(`https://api.zeks.me/api/hartatahta?apikey=${zeks_api}&text=${far}`)
                        await this.sendImage(from, buff.result, chat, this.templateFormat("HARTA TAHTA", [
                            this.templateItemVariable(`Request`, pushname),
                        ]), () => {
                            console.log("DONE...");
                        });
                    }
                    // =============================================
                    tutorial_addon.push({
                        title: '!hartatahta khyreina',
                        description: this.templateItemCommand("Harta Tahta", "*!hartatahta*  _kata_lanjutan_", [
                            "membuat tulisan gambar harta tahta",
                        ]),
                        rowId: generateRandomString(),
                    });
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
                    // ==========================
                    tutorial_extra_response.push({
                        title: "P",
                        description: "Respon terhadap pesan *P* akan memberitahu untuk mengucapkan salam",
                        rowId: generateRandomString(),
                    });
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
                    // ==========================
                    tutorial_extra_response.push({
                        title: "Assalamu'alaikum gais",
                        description: "Jika ada yang mengucapkan salam maka akan dijawab oleh bot menggunakan Text To Speech yang didalamnya ada nama pengirim salam (penyebutan nama hanya jika user mencantumkan nama di WhatsApp nya)",
                        rowId: generateRandomString(),
                    });
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
                    // ==========================
                    tutorial_extra_response.push({
                        title: "halo kawan2 semua yg ada di grup...",
                        description: "Merespon balik kalimat " + list.map(v => `*${String(v).replace(" ", "")}*`).join(", "),
                        rowId: generateRandomString(),
                    });
                },
                slebew: async () => {
                    if (String(message).toLowerCase().includes("slebew") && !String(message).toLowerCase().startsWith("slebew")) {
                        await fungsi.chatRead();
                        await fungsi.reply("slebew...");
                    }
                    // ==========================
                    tutorial_extra_response.push({
                        title: 'tolong kasih slebew bot',
                        description: "Bot akan membalas *Slebew...* jika terdapat kalimat slebew di dalam message (untuk paling depan tidak tereksekusi, harus ditengah2 atau akhir)",
                        rowId: generateRandomString(),
                    });
                },
                tag_semua: async () => {
                    if (String(message).includes("@semua")) {
                        if (isGroup) {
                            await this.hideTagWithMessage(from, chat, message);
                        } else {
                            await fungsi.only_group();
                        }
                    }
                    // ==========================
                    tutorial_extra_response.push({
                        title: "kira2 @semua setuju tidak kalau kita meet lagi?",
                        description: "Menandai semua member grup dengan cara menambahkan *@semua* dan akan di kirim ulang oleh si bot untuk menandai semua orang",
                        rowId: generateRandomString(),
                    });
                },
                send_contact_to_join: async () => {
                    if (isGroup) {
                        if (type === contact) {
                            const number = String(message.vcard)
                                .split("\n")[4]
                                .split("waid=")[1]
                                .split(":")[0]
                            // console.log({ woke: message, number });
                            this.addMemberToGroup(from, [number], () => {
                                console.log("new member from join...");
                            })
                        }
                    }
                    // ==========================
                    tutorial_extra_response.push({
                        title: "kamu harus mengirimkan kontak kedalam grup nanti bakalan di add oleh bot secara otomatis",
                        description: "Send nomor kontak kedalam grup akan otomatis masuk kedalam grup",
                        rowId: generateRandomString(),
                    });
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
                        if (isGroup) {
                            const menu = args[0];
                            if (menu === "button") {
                                this.sendButton(from, chat, "testing", "ttd : testing bot", [
                                    "!tentang xp",
                                    "!tentang strike",
                                    "!tutorial",
                                ], () => {
                                    //
                                })
                            } else if (menu === "fetch") {
                                const result = await this.fetchJson(`https://api.zeks.me/api/memeindo?apikey=${zeks_api}`);
                                console.log({ result });
                            } else if (menu === "list") {
                                const sections = [
                                    {
                                        title: "Standard",
                                        rows: [
                                            { title: 'Row 1', description: "Hello it's description 1", rowId: "rowid1" },
                                            { title: 'Row 2', description: "Hello it's description 2", rowId: "rowid2" },
                                        ],
                                    },
                                ];
                                await this.sendList(from, chat, this.templateFormat("TUTORIAL", [
                                    this.templateItemVariable(`Request`, pushname),
                                ]), "Menu Tutorial", sections, () => {
                                    console.log("DONE...");
                                })
                            } else if (menu === "ig") {
                                const link = args[1];
                                const code = String(link)
                                    .split(".com")[1]
                                    .split("/")[2]
                                console.log({ link, code });
                            } else if (menu === "skip") {
                                const chat = `TANYA : iki jane opo sih yu? ​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​\nnah iso ngene ki nah, opo jal?`;
                                await fungsi.reply(chat)
                            }
                        } else {
                            await fungsi.only_group();
                        }
                    }
                },
                // ===============================================================================================
                //// dapatkan list dari array setiap section
                tutorial: async (group_verify, add_tutorial) => {
                    if ([
                        this.prefix + "tutorial",
                        this.prefix + "help",
                        this.prefix + "cmd",
                        this.prefix + "bot",
                    ].some(v => command === v)) {
                        // example
                        const standard = tutorial_standard.length > 0 ? {
                            title: "standard",
                            rows: tutorial_standard,
                        } : null;
                        const addon = tutorial_addon.length > 0 ? {
                            title: "addon",
                            rows: tutorial_addon,
                        } : null;
                        const extra_response = tutorial_extra_response.length > 0 ? {
                            title: "extra response",
                            rows: tutorial_extra_response,
                        } : null;
                        const testing = tutorial_testing.length > 0 ? {
                            title: "testing",
                            rows: tutorial_testing,
                        } : null;
                        // ======================================================================================
                        //// Filtrasi
                        const sections = [
                            standard,
                            addon,
                            extra_response,
                            testing,
                        ].filter(v => {
                            return v !== null;
                        });
                        const tutorial_add_tutorial = group_verify ? add_tutorial : [];
                        // ======================================================================================
                        await this.sendList(from, chat, this.templateFormat("TUTORIAL", [
                            this.templateItemVariable(`Request`, pushname),
                            this.templateItemNext(),
                            this.templateItemTitle("LEARNING"),
                            this.templateItemCommand("KETERANGAN", "", [
                                "*judul list* : contoh eksekusi",
                                "```deskripsi``` : keterangan dari perintah",
                            ], true),
                            ...tutorial_add_tutorial,
                        ]), "Contoh Tutorial", sections, async () => {
                            console.log("show tutorial!");
                            if (group_verify)
                                await fungsi.reply(`!edit member\nnama panjang baru\nuniversitas baru\nnama kelas baru`);
                        })
                    }
                }
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
    listenBlocklist() {
        this.conn.on('CB:Blocklist', json => {
            if (this.blocked.length > 0) return
            for (let i of json[1].blocklist) {
                this.blocked.push(i.replace('c.us', 's.whatsapp.net'))
            }
        })
    }
    // ==================================================================
    //// Function Family
    chatRead = async (from) => {
        await this.conn.chatRead(from);
    }
    // ==================================================================
    //// Sender Family
    /**
     * 
     * @param {String|Number} from 
     * @param {String} message 
     * @param {*} terkirim callback
     * @param {*} gagal_mengirim callback
     */
    async sendMessage(from, message, terkirim = false, gagal_mengirim = false) {
        await this.conn.sendMessage(this.formatter(from), message, MessageType.text).then(() => {
            if (terkirim)
                terkirim();
        }).catch(error => {
            if (gagal_mengirim)
                gagal_mengirim(error);
        })
    }
    reply = async (from, message, type, chat, onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, message, type, { quoted: chat })
            .then(() => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    /**
     * 
     * @param {*} chat primary message
     * @param {*} message content text
     * @param {*} onSuccess callback
     * @param {*} onError callback
     */
    async replyWithPictureAndQuote(chat, message, onSuccess = false, onError = false) {
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
    async replyWithPictureQuoteButton(chat, message, buttonSetup, onSuccess = false, onError = false) {
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
    async sendList(from, chat, description, buttonText, sections, onSuccess = false, onError = false) {
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
     * @param {*} onSuccess callback
     */
    async sendButton(from, chat, message, footer, array_buttons, onSuccess = false) {
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
    sendAudio = async (from, chat, audio_location, onSuccess = false, onError = false) => {
        await this.conn.sendMessage(this.formatter(from), { url: audio_location }, MessageType.audio, { mimetype: Mimetype.mp4Audio, quoted: chat })
            .then(async () => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    sendImage = async (from, buffer, chat, caption = "", onSuccess = false, onError = false) => {
        await this.conn.sendMessage(from, buffer, MessageType.image, { caption: caption, quoted: chat })
            .then(async () => {
                if (onSuccess) onSuccess();
            })
            .catch((error) => {
                if (onError) onError(error);
            })
    }
    sendVideo = async (from, buffer, chat, caption = "", onSuccess = false) => {
        await this.conn.sendMessage(from, buffer, MessageType.video, { caption: caption, quoted: chat })
            .then(() => {
                if (onSuccess)
                    onSuccess();
            })
    }
    sendSticker = async (from, buffer, chat) => {
        await this.conn.sendMessage(from, buffer, MessageType.sticker, { quoted: chat })
    }
    sendPdf = async (from, buffer, title = "myDocument.pdf") => {
        await this.conn.sendMessage(from, buffer, MessageType.document, { mimetype: Mimetype.pdf, title: title })
    }
    sendGif = async (from, buffer) => {
        await this.conn.sendMessage(from, buffer, MessageType.video, { mimetype: Mimetype.gif })
    }
    sendContact = async (from, nomor, nama) => {
        const vcard = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + 'FN:' + nama + '\n' + 'ORG:Kontak\n' + 'TEL;type=CELL;type=VOICE;waid=' + nomor + ':+' + nomor + '\n' + 'END:VCARD'
        await this.conn.sendMessage(from, { displayname: nama, vcard: vcard }, MessageType.contact)
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
    async sendListLangTTS(from, text, chat, onSuccess = false) {
        const inject = this.available_lang.map(lang => {
            return this.templateItemVariable(Object.keys(lang), Object.values(lang))
        });
        await this.reply(from, this.templateFormat("Speech Language Available", [
            ...inject,
        ]), text, chat, () => {
            if (onSuccess)
                onSuccess();
        })
    }
    // =================================================================
    //// Addon
    /**
     *
     * @param {String} lang
     * @param {String} text_speech
     * @param {String} mp3_path
     * @param {*} lang_not_available
     */
    async getTTS(lang, text_speech, mp3_path, lang_not_available = false) {
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
    async sendTTS(from, chat, lang, text_speech, lang_not_available = false, onSuccess = false) {
        const lower_lang = String(lang).toLowerCase();
        await this.getTTS(lower_lang, text_speech, (mp3_path) => {
            this.sendAudio(from, chat, mp3_path, () => {
                this.deleteFile(mp3_path, () => {
                    if (onSuccess) onSuccess();
                });
            });
        }, (error) => {
            if (lang_not_available) lang_not_available(error);
        });
    }
    async getYoutubeInfo(videoID) {
        return await this.fetchJson(`${myAPI}/ytdl?url=${videoID}`);
    }
    // =================================================================
}

module.exports = WhatsApp;
