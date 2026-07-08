import 'dotenv/config';
import { XMonitor } from './services/x-monitor.js';
import { DexScreenerBridge } from './services/dexscreener-bridge.js';
import { SolanaAnalyzer } from './services/solana-analyzer.js';
import { TelegramSender } from './services/telegram-sender.js';
import { logger } from './utils/logger.js';

const xMonitor = new XMonitor();
const dexBridge = new DexScreenerBridge();
const analyzer = new SolanaAnalyzer();
const tg = new TelegramSender();

const postedTickers = new Set();

async function runSocialPipeline() {
    logger.info('🚀 SOCIAL SNIPER PIPELINE STARTED.');
    
    while (true) {
        try {
            // 1. Get tickers mentioned by whales on X
            const tickers = await xMonitor.getLatestTickers();
            
            for (const ticker of tickers) {
                if (postedTickers.has(ticker)) continue;
                
                // 2. Find the Solana contract for this ticker
                const tokenData = await dexBridge.getSolanaContractByTicker(ticker);
                if (!tokenData || tokenData.liquidity < 10000) {
                    logger.info(`⏭️ Skipping $${ticker} (No valid Solana pair or low liquidity).`);
                    postedTickers.add(ticker);
                    continue;
                }
                
                // 3. Audit the smart contract for honeypots
                const audit = await analyzer.analyzeToken(tokenData.address);
                
                // 4. Broadcast to Telegram if secure
                if (audit.score >= 7) {
                    let msg = `🐋 <b>WHALE ALERT: SOCIAL MOMENTUM DETECTED</b> 🐋\n\n`;
                    msg += `🐦 <b>Source:</b> Trending on X (Twitter)\n`;
                    msg += `🪙 <b>Ticker:</b> $${tokenData.symbol}\n`;
                    msg += `📜 <b>Contract:</b> <code>${tokenData.address}</code>\n\n`;
                    msg += `📊 <b>Liquidity:</b> $${tokenData.liquidity.toLocaleString()}\n`;
                    msg += `🛡️ <b>Security:</b> ${audit.score}/10 (${audit.verdict})\n\n`;
                    msg += `🔗 <a href="https://dexscreener.com/solana/${tokenData.address}">Chart & Trade</a>\n\n`;
                    msg += `👉 <b>Join for more Alpha:</b> @insider_memecoin10x`;
                    
                    await tg.sendMessage(msg);
                    logger.info(`✅ Posted $${ticker} to Telegram!`);
                } else {
                    logger.info(`❌ REJECTED: $${ticker} failed security audit (Score: ${audit.score}).`);
                }
                
                postedTickers.add(ticker);
                await new Promise(r => setTimeout(r, 2000)); // Rate limit protection
            }
        } catch (error) {
            logger.error(`Pipeline Error: ${error.message}`);
        }
        
        logger.info('Waiting 60 seconds before next X scan...');
        await new Promise(r => setTimeout(r, 60000));
    }
}

runSocialPipeline().catch(err => logger.error(`Fatal Error: ${err.message}`));
