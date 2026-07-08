import { config } from 'dotenv';
config();
import axios from 'axios';

async function checkStatus() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const numericId = "-1004307895794"; // The exact ID we found!
    
    try {
        // Get Bot's ID correctly
        const meRes = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        const botId = meRes.data.result.id; 
        
        // Check if bot is in the channel
        const memberRes = await axios.get(`https://api.telegram.org/bot${token}/getChatMember?chat_id=${numericId}&user_id=${botId}`);
        
        console.log("✅ SUCCESS: BOT IS IN THE CHANNEL!");
        console.log("🛡️ Role:", memberRes.data.result.status);
        console.log("📝 Can Post:", memberRes.data.result.can_post_messages);
        
    } catch (error) {
        console.log("❌ CONFIRMED: BOT IS NOT IN THE CHANNEL.");
        console.log("Telegram API says:", error.response?.data?.description);
    }
}
checkStatus();
