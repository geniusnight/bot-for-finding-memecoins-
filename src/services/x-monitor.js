import { Scraper } from 'agent-twitter-client';
import { logger } from '../utils/logger.js';

export class XMonitor {
    constructor() {
        this.scraper = new Scraper();
        // THE WHALE WATCHLIST: Add more influencers here!
        this.whitelist = ['blknoiz06', 'hsakatrades', 'ansabornothing']; 
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        try {
            logger.info('Initializing X (Twitter) Scraper...');
            await this.scraper.login(
                process.env.X_USERNAME, 
                process.env.X_PASSWORD,
                process.env.X_EMAIL
            );
            this.isInitialized = true;
            logger.info('✅ X Scraper logged in successfully.');
        } catch (error) {
            logger.error(`❌ X Login Failed: ${error.message}`);
            throw error;
        }
    }

    async getLatestTickers() {
        if (!this.isInitialized) await this.initialize();
        
        const tickers = new Set();
        logger.info(`Scanning X for cashtags from ${this.whitelist.length} whales...`);

        for (const username of this.whitelist) {
            try {
                // Fetch the last 5 tweets from this whale
                const tweets = await this.scraper.getTweets(username, 5);
                
                for await (const tweet of tweets) {
                    // Regex to find cashtags like $WIF, $POPCAT
                    const matches = tweet.text.match(/\$[A-Z]{2,10}/g);
                    if (matches) {
                        matches.forEach(t => {
                            const ticker = t.replace('$', '');
                            // Filter out major coins we don't care about
                            if (!['USD', 'BTC', 'ETH', 'SOL', 'USDT'].includes(ticker)) {
                                tickers.add(ticker);
                            }
                        });
                    }
                }
            } catch (error) {
                logger.error(`Failed to scrape ${username}: ${error.message}`);
            }
        }
        
        const uniqueTickers = Array.from(tickers);
        logger.info(`Found ${uniqueTickers.length} unique tickers: ${uniqueTickers.join(', ')}`);
        return uniqueTickers;
    }
}
