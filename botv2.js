const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

async function getCsrfToken() {
    try {
        const response = await axios.post('https://auth.roblox.com/v2/logout', {}, {
            headers: { Cookie: `.ROBLOSECURITY=${ROBLOX_COOKIE}` }
        });
        return response.headers['x-csrf-token'];
    } catch (error) {
        console.error("❌ CSRF Token alınamadı. Cookie bilgisini kontrol et.");
        return null;
    }
}

async function changeRank(userId, roleId) {
    const csrfToken = await getCsrfToken();
    if (!csrfToken) return false;

    try {
        const response = await axios.post(
            `https://groups.roblox.com/v1/groups/${ROBLOX_GROUP_ID}/users/${userId}/roleset`,
            { roleId },
            {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Cookie': `.ROBLOSECURITY=${ROBLOX_COOKIE}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.status === 200;
    } catch (error) {
        console.error(`❌ Hata Kodu: ${error.response.status}, Cevap: ${error.response.data}`);
        return false;
    }
}

client.on('messageCreate', async message => {
    if (!message.content.startsWith('!setrank') || message.author.bot) return;

    const args = message.content.split(' ');
    if (args.length < 3) {
        return message.reply("❌ Kullanım: !setrank <userId> <roleId>");
    }

    const userId = args[1];
    const roleId = args[2];
    const success = await changeRank(userId, roleId);

    if (success) {
        message.reply(`✅ Kullanıcı ${userId} başarıyla ${roleId} rolüne yükseltildi.`);
    } else {
        message.reply("❌ Rank değiştirme başarısız. Yetkileri veya giriş bilgilerini kontrol et.");
    }
});

client.login(DISCORD_TOKEN);
