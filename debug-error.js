import { config } from 'dotenv';
config();
import axios from 'axios';

async function debug() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const numericId = "-1004307895794";
    
    console.log("Sending request to Telegram...");
    try {
        const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: numericId,
            text: "Test"
        });
        console.log("✅ SUCCESS:", res.data);
    } catch (error) {
        console.log("\n--- FULL ERROR DUMP ---");
        console.log("1. Error Message:", error.message);
        if (error.response) {
            console.log("2. HTTP Status:", error.response.status);
            console.log("3. Telegram Raw Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.log("2. No response received (Network/VM issue).");
        }
        console.log("-----------------------\n");
    }
}
debug();
