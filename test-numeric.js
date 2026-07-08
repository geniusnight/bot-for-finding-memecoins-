import { config } from 'dotenv';
config();
import axios from 'axios';

async function testNumericId() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const numericId = "-1004307895794"; // The exact ID we found earlier
    
    console.log(`Testing with Numeric ID: ${numericId}...`);
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: numericId,
            text: "✅ SUCCESS: Bot is posting via Numeric ID!"
        });
        console.log("🎉 IT WORKED! The bot successfully posted to the channel.");
        console.log("\n👉 ACTION REQUIRED: Update your .env file now!");
        console.log(`Change: TELEGRAM_CHANNEL_ID=@insider_memecoin10x`);
        console.log(`To:     TELEGRAM_CHANNEL_ID=${numericId}`);
    } catch (error) {
        console.error("❌ Still failing with Numeric ID.");
        console.error("Telegram says:", error.response?.data || error.message);
    }
}
testNumericId();
