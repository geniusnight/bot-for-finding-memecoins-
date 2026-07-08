import axios from 'axios';
import { logger } from '../utils/logger.js';

export class DiscordBroadcaster {
    constructor() {
        // THIS IS YOUR TARGET LIST. 
        // You will paste the Webhook URLs you get from Discord servers here.
        this.webhooks = process.env.DISCORD_WEBHOOKS 
            ? process.env.DISCORD_WEBHOOKS.split(',') 
            : [];
            
        if (this.webhooks.length === 0) {
            logger.warn('⚠️ No Discord Webhooks found in .env file. Broadcaster is idle.');
        }
    }

    /**
     * Broadcasts a Teaser message to all configured Discord Webhooks
     * @param {Object} tokenData - The token data from GeckoTerminal
     */
    async broadcastTeaser(tokenData) {
        if (this.webhooks.length === 0) return;

        logger.info(`📡 Broadcasting $${tokenData.symbol} teaser to ${this.webhooks.length} Discord servers...`);

        // Format the message specifically for Discord (Discord uses Markdown, not HTML)
        const teaserMessage = `💎 **PRO ALPHA: HIGH-CONVICTION SOLANA PLAY** 💎\n\n` +
            `Just sniped a fully audited, mint-renounced Solana memecoin sitting at low MC. Volume is exploding. 🚀\n\n` +
            `🪙 **Ticker:** $${tokenData.symbol}\n` +
            `💧 **Liquidity:** $${tokenData.liquidity.toLocaleString()}\n` +
            `🛡️ **Security:** Mint/Freeze revoked. Safe contract.\n\n` +
            `🔗 **Chart:** https://dexscreener.com/solana/${tokenData.address}\n\n` +
            `👉 **Contract address and full audit are live in my Telegram:**\n` +
            `**https://t.me/insider_memecoin10x**`;

        // Send to all webhooks concurrently using Promise.all for maximum speed
        const promises = this.webhooks.map(async (webhookUrl) => {
            try {
                await axios.post(webhookUrl.trim(), {
                    content: teaserMessage,
                    username: "Insider Memecoin 10x | Alpha Bot", // Customizes the bot name in Discord
                    avatar_url: "https://i.imgur.com/AfFp7pu.png" // Optional: Add a cool avatar URL
                });
            } catch (error) {
                logger.error(`Failed to post to a Discord webhook: ${error.message}`);
            }
        });

        await Promise.all(promises);
        logger.info('✅ Discord broadcast complete.');
    }
}
