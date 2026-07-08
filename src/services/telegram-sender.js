import axios from 'axios';
import { logger } from '../utils/logger.js';

export class TelegramSender {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHANNEL_ID;
    }

    async sendMessage(text) {
        try {
            await axios.post(`https://api.telegram.org/bot${this.token}/sendMessage`, {
                chat_id: this.chatId,
                text: text,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });
            logger.info('✅ Posted to Telegram successfully.');
        } catch (error) {
            logger.error(`❌ Telegram Error: ${error.response?.data?.description || error.message}`);
        }
    }
}
