import { config } from 'dotenv';
config();
import axios from 'axios';

async function testConnection() {
    console.log("Is .env loaded?", process.env.TELEGRAM_BOT_TOKEN ? "YES" : "NO - FIX YOUR .ENV");
    console.log("Target Channel:", process.env.TELEGRAM_CHANNEL_ID);
    
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: process.env.TELEGRAM_CHANNEL_ID,
            text: "✅ SUCCESS: Bot has permission to post to this channel!"
        });
        console.log("🎉 Test passed!");
    } catch (error) {
        console.error("❌ Test failed. Telegram says:", error.response?.data || error.message);
    }
}
testConnection();
