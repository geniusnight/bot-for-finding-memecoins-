import { Connection, PublicKey } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';
import { logger } from '../utils/logger.js';

/**
 * Solana Token Security Analyzer
 * Connects to the Solana blockchain via RPC to inspect SPL Token metadata.
 * Checks for Mint Authority and Freeze Authority (Primary Solana Honeypot vectors).
 */
export class SolanaAnalyzer {
    constructor() {
        // Initialize the connection using the secure environment variable
        const rpcUrl = process.env.SOLANA_RPC_URL;
        if (!rpcUrl) {
            throw new Error('CRITICAL: SOLANA_RPC_URL is missing in your .env file.');
        }
        
        // 'confirmed' ensures we are reading finalized, secure blockchain data
        this.connection = new Connection(rpcUrl, 'confirmed');
    }

    /**
     * Analyzes a Solana token address for security risks.
     * @param {string} tokenAddress - The base58 Solana token contract address.
     * @returns {Promise<Object>} - A structured object containing the audit results.
     */
    async analyzeToken(tokenAddress) {
        try {
            logger.info(`[SolanaAnalyzer] Initiating security audit for: ${tokenAddress}`);
            
            // Convert the string address into a Solana PublicKey object
            const mintPublicKey = new PublicKey(tokenAddress);

            // Fetch the raw mint data directly from the Solana blockchain via RPC
            const mintInfo = await getMint(this.connection, mintPublicKey);

            // --- SECURITY LOGIC ---
            // 1. Check Mint Authority (Can the dev print infinite tokens?)
            const hasMintAuthority = mintInfo.mintAuthority !== null;
            
            // 2. Check Freeze Authority (Can the dev freeze user wallets? / Honeypot)
            const hasFreezeAuthority = mintInfo.freezeAuthority !== null;
            
            // 3. Calculate Total Supply based on decimals
            const totalSupply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);

            // --- SCORING SYSTEM ---
            let score = 10;
            let warnings = [];

            if (hasMintAuthority) {
                score -= 4;
                warnings.push('⚠️ MINT AUTHORITY ENABLED (Developer can print infinite tokens)');
            }
            
            if (hasFreezeAuthority) {
                score -= 6; // Freeze authority is highly dangerous in memecoins
                warnings.push('🚨 FREEZE AUTHORITY ENABLED (High risk of Honeypot)');
            }

            // Prevent negative scores
            if (score < 0) score = 0;

            // Determine final verdict
            let verdict = '✅ SECURE';
            if (score < 8) verdict = '⚠️ CAUTION';
            if (score < 5) verdict = '❌ DANGEROUS / LIKELY SCAM';

            // Return the structured data
            return {
                success: true,
                tokenAddress,
                totalSupply: totalSupply.toLocaleString(),
                decimals: mintInfo.decimals,
                score: score,
                warnings: warnings,
                verdict: verdict
            };

        } catch (error) {
            // Catch and log errors without crashing the bot
            logger.error(`[SolanaAnalyzer] Failed to audit token ${tokenAddress}: ${error.message}`);
            
            return {
                success: false,
                error: 'Invalid token address, or the RPC connection failed. Please check the address and try again.'
            };
        }
    }
}