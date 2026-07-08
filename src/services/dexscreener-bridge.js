import axios from 'axios';
import { logger } from '../utils/logger.js';

export class DexScreenerBridge {
    async getSolanaContractByTicker(ticker) {
        try {
            logger.info(`Querying DexScreener for Solana pair: $${ticker}`);
            const res = await axios.get(`https://api.dexscreener.com/latest/dex/search?q=${ticker}`);
            
            // Filter for Solana chains only
            const solanaPairs = res.data.pairs.filter(p => p.chainId === 'solana');
            
            if (solanaPairs.length > 0) {
                // Sort by liquidity to ensure we get the "real" token, not a fake copycat
                solanaPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                const mainPair = solanaPairs[0];
                
                return {
                    address: mainPair.baseToken.address,
                    symbol: mainPair.baseToken.symbol,
                    name: mainPair.baseToken.name,
                    liquidity: mainPair.liquidity?.usd || 0
                };
            }
            return null;
        } catch (error) {
            logger.error(`DexScreener API error for $${ticker}: ${error.message}`);
            return null;
        }
    }
}
