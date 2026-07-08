// import { config } from 'dotenv';
// config(); // 1. Load the .env file

// import axios from 'axios';
// import { Connection, PublicKey } from '@solana/web3.js';
// import { getMint } from '@solana/spl-token';

// // 2. Initialize Connections
// const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
// const RPC_URL = process.env.SOLANA_RPC_URL;

// if (!TELEGRAM_TOKEN || !CHANNEL_ID || !RPC_URL) {
//     console.error("CRITICAL: Missing variables in .env file!");
//     process.exit(1);
// }

// const solanaConnection = new Connection(RPC_URL, 'confirmed');

// // Track which tokens we have already posted so we don't spam the channel
// const postedTokens = new Set();

// /**
//  * Fetches the newest Solana memecoins from GeckoTerminal (Free API, no key needed)
//  */
// async function getNewSolanaTokens() {
//     try {
//         const response = await axios.get('https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=1');
//         const pools = response.data.data;
        
//         // Extract the base token addresses from the new pools
//         return pools.map(pool => {
//             // The base token is usually the first one in the relationship
//             const baseTokenId = pool.relationships.base_token.data.id;
//             // GeckoTerminal ID format is "network_address", we just need the address
//             return baseTokenId.split('_')[1]; 
//         });
//     } catch (error) {
//         console.error("Failed to fetch new pools:", error.message);
//         return [];
//     }
// }

// /**
//  * Analyzes a Solana token for Honeypot vectors (Freeze/Mint Authority)
//  */
// async function analyzeToken(tokenAddress) {
//     try {
//         const mintInfo = await getMint(solanaConnection, new PublicKey(tokenAddress));
        
//         const hasMintAuthority = mintInfo.mintAuthority !== null;
//         const hasFreezeAuthority = mintInfo.freezeAuthority !== null;
        
//         let score = 10;
//         let warnings = [];

//         if (hasMintAuthority) {
//             score -= 4;
//             warnings.push('⚠️ Mint Authority ON (Dev can print tokens)');
//         }
//         if (hasFreezeAuthority) {
//             score -= 6;
//             warnings.push('🚨 Freeze Authority ON (Honeypot Risk!)');
//         }

//         return { score, warnings, success: true };
//     } catch (error) {
//         return { success: false, error: 'Invalid Token' };
//     }
// }

// /**
//  * Sends a formatted message to your Telegram Channel
//  */
// async function sendToTelegram(message) {
//     try {
//         const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
//         await axios.post(url, {
//             chat_id: CHANNEL_ID,
//             text: message,
//             parse_mode: 'HTML',
//             disable_web_page_preview: true
//         });
//         console.log("✅ Posted to Telegram successfully.");
//     } catch (error) {
//         console.error("❌ Telegram API Failed!");
//         if (error.response) {
//             // If Telegram replied with an error code (e.g., 400 Bad Request, 401 Unauthorized)
//             console.error("Telegram Status Code:", error.response.status);
//             console.error("Telegram Error Details:", error.response.data);
//         } else {
//             // If it's a network error (e.g., blocked internet, proxy issue)
//             console.error("Network/System Error:", error.message);
//         }
//     }
// }
// /**
//  * THE MAIN AUTOMATION LOOP
//  */
// async function runAutomationLoop() {
//     console.log(`🚀 Bot Started. Scanning Solana for new memecoins...`);
//     console.log(`Target Channel: ${CHANNEL_ID}`);
    
//     while (true) {
//         try {
//             console.log("\n--- Scanning for new tokens ---");
//             const newTokens = await getNewSolanaTokens();
            
//             for (const tokenAddress of newTokens) {
//                 // Skip if we already posted this token
//                 if (postedTokens.has(tokenAddress)) continue;
                
//                 console.log(`Analyzing: ${tokenAddress}`);
//                 const analysis = await analyzeToken(tokenAddress);
                
//                 if (!analysis.success) continue;

//                 // Format the message for Telegram
//                 let message = `🚨 <b>NEW SOLANA MEMECOIN DETECTED</b> 🚨\n\n`;
//                 message += `📜 <b>Contract:</b> <code>${tokenAddress}</code>\n`;
//                 message += `🛡️ <b>Safety Score:</b> ${analysis.score}/10\n`;
                
//                 if (analysis.warnings.length > 0) {
//                     message += `\n⚠️ <b>Warnings:</b>\n${analysis.warnings.join('\n')}\n`;
//                 } else {
//                     message += `\n✅ <b>Status:</b> No Mint/Freeze authorities detected.\n`;
//                 }
                
//                 message += `\n🔗 <a href="https://dexscreener.com/solana/${tokenAddress}">View on DexScreener</a>`;

//                 // Post to Telegram
//                 await sendToTelegram(message);
                
//                 // Mark as posted so we don't spam
//                 postedTokens.add(tokenAddress);
                
//                 // Wait 2 seconds between posts to avoid Telegram rate limits
//                 await new Promise(resolve => setTimeout(resolve, 2000)); 
//             }
//         } catch (error) {
//             console.error("Loop error:", error.message);
//         }

//         // Wait 60 seconds before scanning again (Prevents Public RPC rate limits)
//         console.log("Waiting 60 seconds before next scan...");
//         await new Promise(resolve => setTimeout(resolve, 60000));
//     }
// }

// // Start the bot
// runAutomationLoop();





/**
 * Fetches new Solana pools but applies STRICT professional filters
 */
async function getHighQualityTokens() {
    try {
        // We use new_pools but we will filter them heavily
        const response = await axios.get('https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=1');
        const pools = response.data.data;
        
        const highQualityTokens = [];

        for (const pool of pools) {
            const attributes = pool.attributes;
            const baseTokenId = pool.relationships.base_token.data.id.split('_')[1];
            
            // --- PROFESSIONAL FILTERS ---
            const liquidity = parseFloat(attributes.reserve_in_usd || 0);
            const volume5m = parseFloat(attributes.volume_usd?.h1 || 0); // Using 1h volume as h1 is more reliable
            
            // Filter 1: Minimum $10,000 Liquidity (Prevents instant rugs)
            if (liquidity < 10000) continue; 
            
            // Filter 2: Minimum $20,000 Volume (Proves real trading activity)
            if (volume5m < 20000) continue;

            highQualityTokens.push({
                address: baseTokenId,
                name: attributes.name || "Unknown",
                symbol: attributes.symbol || "???",
                liquidity: liquidity,
                volume: volume5m
            });
        }
        
        return highQualityTokens;
    } catch (error) {
        console.error("Failed to fetch pools:", error.message);
        return [];
    }
}

/**
 * THE MAIN AUTOMATION LOOP (UPGRADED)
 */
async function runAutomationLoop() {
    console.log(`🚀 Professional Bot Started. Scanning for HIGH-QUALITY Solana memecoins...`);
    console.log(`Target Channel: ${process.env.TELEGRAM_CHANNEL_ID}`);
    
    // Initialize the Solana Analyzer
    const analyzer = new SolanaAnalyzer(); 

    while (true) {
        try {
            console.log("\n--- Scanning for high-quality tokens ---");
            const qualityTokens = await getHighQualityTokens();
            console.log(`Found ${qualityTokens.length} tokens passing Liquidity/Volume filters.`);
            
            for (const token of qualityTokens) {
                if (postedTokens.has(token.address)) continue;
                
                console.log(`Auditing Security for: ${token.symbol} (${token.address})`);
                
                // Filter 3: Security Check (Must pass the Solana Analyzer)
                const audit = await analyzer.analyzeToken(token.address);
                
                if (!audit.success || audit.score < 7) {
                    console.log(`❌ REJECTED: ${token.symbol} failed security audit (Score: ${audit.score}/10).`);
                    postedTokens.add(token.address); // Mark as processed so we don't re-audit
                    continue;
                }

                console.log(`✅ APPROVED: ${token.symbol} passed all filters! Posting to Telegram.`);

                // Format the Professional Telegram Message
                let message = `💎 <b>PRO ALPHA: HIGH-CONVICTION SOLANA PLAY</b> 💎\n\n`;
                message += `🪙 <b>Ticker:</b> $${token.symbol}\n`;
                message += `📜 <b>Contract:</b> <code>${token.address}</code>\n\n`;
                message += `📊 <b>Market Data:</b>\n`;
                message += `└ 💧 Liquidity: $${token.liquidity.toLocaleString()}\n`;
                message += `└ 📈 Volume (1H): $${token.volume.toLocaleString()}\n\n`;
                message += `🛡️ <b>Security Audit:</b> ${audit.score}/10 (${audit.verdict})\n`;
                
                if (audit.warnings.length > 0) {
                    message += `⚠️ <b>Notes:</b> ${audit.warnings.join(' | ')}\n`;
                } else {
                    message += `✅ <b>Notes:</b> Mint/Freeze authorities revoked. Safe contract.\n`;
                }
                
                message += `\n🔗 <a href="https://dexscreener.com/solana/${token.address}">Chart & Trade</a>`;
                message += `\n\n👉 <b>Join for more Alpha:</b> @insider_memecoin10x`;

                await sendToTelegram(message);
                postedTokens.add(token.address);
                
                // Wait 3 seconds between posts to maintain a premium feel (avoid spamming)
                await new Promise(resolve => setTimeout(resolve, 3000)); 
            }
        } catch (error) {
            console.error("Loop error:", error.message);
        }

        // Wait 120 seconds (2 minutes) between scans. Professional bots don't spam; they curate.
        console.log("Waiting 120 seconds for next scan...");
        await new Promise(resolve => setTimeout(resolve, 120000));
    }
}