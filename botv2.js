const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ROBLOX_GROUP_ID = process.env.ROBLOX_GROUP_ID;
const ROBLOX_COOKIE = process.env.ROBLOX_COOKIE;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Function to retrieve CSRF token from Roblox API
async function getCsrfToken() {
    try {
        const response = await axios.post('https://auth.roblox.com/v2/logout', {}, {
            headers: { Cookie: `.ROBLOSECURITY=${ROBLOX_COOKIE}` }
        });
        return response.headers['x-csrf-token'];
    } catch (error) {
        console.error("❌ Failed to retrieve CSRF token. Check the cookie information.");
        return null;
    }
}

// Function to change a user's rank in the Roblox group
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
        console.error(`❌ Error Code: ${error.response.status}, Response: ${error.response.data}`);
        return false;
    }
}

// Event listener for messages
client.on('messageCreate', async message => {
    if (!message.content.startsWith('!setrank') || message.author.bot) return;

    const args = message.content.split(' ');
    if (args.length < 3) {
        return message.reply("❌ Usage: !setrank <userId> <roleId>");
    }

    const userId = args[1];
    const roleId = args[2];
    const success = await changeRank(userId, roleId);

    if (success) {
        message.reply(`✅ User ${userId} has been successfully promoted to role ${roleId}.`);
    } else {
        message.reply("❌ Rank change failed. Check permissions or login credentials.");
    }
});

// Log in to Discord with the bot token
client.login(DISCORD_TOKEN);
