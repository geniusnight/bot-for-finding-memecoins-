import 'dotenv/config';
import axios from 'axios';
import { SolanaAnalyzer } from './services/solana-analyzer.js';
import { TelegramSender } from './services/telegram-sender.js';
import { DiscordBroadcaster } from './services/discord-broadcaster.js';
import { logger } from './utils/logger.js';

const analyzer = new SolanaAnalyzer();
const tg = new TelegramSender();
const discord = new DiscordBroadcaster();
const postedTokens = new Set();

async function getHighQualityTokens() {
    try {
        const response = await axios.get('https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=1');
        const pools = response.data.data;
        
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

async function runTrafficEngine() {
    logger.info('🚀 TELEGRAM + DISCORD TRAFFIC ENGINE STARTED.');
    
    while (true) {
        try {
            const tokens = await getHighQualityTokens();
            logger.info(`Found ${tokens.length} tokens passing filters.`);
            
            for (const token of tokens) {
                if (postedTokens.has(token.address)) continue;
                
                const audit = await analyzer.analyzeToken(token.address);
                
                if (audit.score >= 7) {
                    logger.info(`✅ APPROVED: $${token.symbol} passed security audit.`);
                    
                    // 1. POST FULL ALPHA TO TELEGRAM
                    let tgMsg = `💎 <b>PRO ALPHA: $${token.symbol}</b> 💎\n\n`;
                    tgMsg += `📜 <b>Contract:</b> <code>${token.address}</code>\n`;
                    tgMsg += `💧 <b>Liquidity:</b> $${token.liquidity.toLocaleString()}\n`;
                    tgMsg += `🛡️ <b>Security:</b> ${audit.score}/10 (${audit.verdict})\n\n`;
                    tgMsg += `🔗 <a href="https://dexscreener.com/solana/${token.address}">Chart</a>`;
                    
                    await tg.sendMessage(tgMsg);
                    
                    // 2. BROADCAST TEASER TO DISCORD (DRIVING TRAFFIC TO TELEGRAM)
                    await discord.broadcastTeaser(token);
                    
                } else {
                    logger.info(`❌ REJECTED: $${token.symbol} failed audit.`);
                }
                
                postedTokens.add(token.address);
                await new Promise(r => setTimeout(r, 3000));
            }
        } catch (error) {
            logger.error(`Engine Error: ${error.message}`);
        }
        
        logger.info('Waiting 120 seconds for next scan...');
        await new Promise(r => setTimeout(r, 120000));
    }
}

runTrafficEngine().catch(err => logger.error(`Fatal Error: ${err.message}`));
