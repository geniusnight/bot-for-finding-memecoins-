import 'dotenv/config'; // Must be the first line to load .env
import axios from 'axios';
import { SolanaAnalyzer } from './services/solana-analyzer.js';
import { TelegramSender } from './services/telegram-sender.js';
import { logger } from './utils/logger.js';

const analyzer = new SolanaAnalyzer();
const tg = new TelegramSender();
const postedTokens = new Set();

async function getHighQualityTokens() {
    try {
        const response = await axios.get('https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=1');
        const pools = response.data.data;
        
        // Apply strict professional filters
        return pools.map(pool => {
            const attrs = pool.attributes;
            return {
                address: pool.relationships.base_token.data.id.split('_')[1],
                symbol: attrs.symbol || "???",
                liquidity: parseFloat(attrs.reserve_in_usd || 0),
                volume: parseFloat(attrs.volume_usd?.h1 || 0)
            };
        }).filter(t => t.liquidity >= 10000 && t.volume >= 20000);
    } catch (error) {
        logger.error(`GeckoTerminal API Error: ${error.message}`);
        return [];
    }
}

async function runLoop() {
    logger.info('🚀 Professional Modular Bot Started.');
    while (true) {
        const tokens = await getHighQualityTokens();
        logger.info(`Found ${tokens.length} tokens passing Liquidity/Volume filters.`);
        
        for (const token of tokens) {
            if (postedTokens.has(token.address)) continue;
            
            const audit = await analyzer.analyzeToken(token.address);
            if (audit.score < 7) {
                logger.info(`❌ REJECTED: ${token.symbol} failed security audit (Score: ${audit.score}).`);
                postedTokens.add(token.address);
                continue;
            }
            
            logger.info(`✅ APPROVED: ${token.symbol} passed all filters!`);
            
            // Format the Professional Telegram Message
            let tgMsg = `💎 <b>PRO ALPHA: HIGH-CONVICTION SOLANA PLAY</b> 💎\n\n`;
            tgMsg += `🪙 <b>Ticker:</b> $${token.symbol}\n`;
            tgMsg += `📜 <b>Contract:</b> <code>${token.address}</code>\n\n`;
            tgMsg += `📊 <b>Liquidity:</b> $${token.liquidity.toLocaleString()} | <b>Vol:</b> $${token.volume.toLocaleString()}\n`;
            tgMsg += `🛡️ <b>Security:</b> ${audit.score}/10 (${audit.verdict})\n\n`;
            tgMsg += `🔗 <a href="https://dexscreener.com/solana/${token.address}">Chart & Trade</a>`;
            
            await tg.sendMessage(tgMsg);
            postedTokens.add(token.address);
            
            // Wait 3 seconds between posts to maintain a premium feel
            await new Promise(r => setTimeout(r, 3000));
        }
        
        logger.info('Waiting 120 seconds for next scan...');
        await new Promise(r => setTimeout(r, 120000));
    }
}

runLoop().catch(err => logger.error(`Fatal Error: ${err.message}`));
