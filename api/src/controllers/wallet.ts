/**
 * Wallet route — uses real wallet address from engine state.
 * ETH balance fetched from Cloudflare public RPC when engine is running.
 */

import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { getEthPriceUsd } from "../services/priceOracle";
import { sharedEngineState, WalletAccount } from "../services/engineState";
import { logger } from "../services/logger";

const router = Router();

async function fetchEthBalance(address: string, chainId: number = 1): Promise<number> {
  if (!address) return 0;
  
  // Multi-chain RPC Mapping for Balance Detection
  const rpcMap: Record<number, string> = {
    1: "https://cloudflare-eth.com",
    8453: "https://mainnet.base.org",
    42161: "https://arb1.arbitrum.io/rpc",
    137: "https://polygon-rpc.com"
  };
  
  const rpc = rpcMap[chainId] || rpcMap[1];

  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json() as { result?: string };
      if (data.result) {
        // Convert from wei (hex) to ETH
        const weiHex = BigInt(data.result);
        return Number(weiHex) / 1e18;
      }
    }
  } catch (_) {}
  return 0;
}

router.get("/wallet", async (req, res) => {
  try {
    const ethPrice = await getEthPriceUsd();
    
    // Refresh balances for all synchronized wallets
    for (const w of sharedEngineState.wallets) {
      w.balanceEth = await fetchEthBalance(w.address, w.chainId);
    }

    res.json({
      wallets: sharedEngineState.wallets,
      activeAddress: sharedEngineState.walletAddress,
      ethPriceUsd: ethPrice,
      autoWithdraw: sharedEngineState.autoWithdrawEnabled,
      history: sharedEngineState.withdrawalHistory,
      liveCapable: sharedEngineState.liveCapable,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * BSS-52: Wallet Synchronization & Auto-Population
 * Called when a user selects an account via WalletConnect/MetaMask
 */
router.post("/wallet/sync", async (req, res) => {
  const { address, chainId, source, encryptedPrivateKey } = req.body;

  const newAccount: WalletAccount = {
    id: `acc_${Date.now()}`,
    address,
    chainId: chainId || 1,
    encryptedPrivateKey: encryptedPrivateKey || 'EXTERNAL_SIGNER',
    balanceEth: await fetchEthBalance(address, chainId),
    isActive: sharedEngineState.wallets.length === 0, // Auto-activate if first wallet
    isValidated: true,
    source: source || 'WALLET_CONNECT',
    lastSeen: new Date()
  };

  sharedEngineState.wallets.push(newAccount);
  if (newAccount.isActive) sharedEngineState.walletAddress = address;

  logger.info({ address, source }, "[WALLET] Account synchronized and auto-populated");
  res.json({ success: true, wallet: newAccount });
});

/**
 * BSS-52: Activate/Deactivate Wallet
 */
router.post("/wallet/activate", async (req, res) => {
  const { walletId, active } = req.body;
  const wallet = sharedEngineState.wallets.find(w => w.id === walletId);

  if (!wallet) return res.status(404).json({ error: "Wallet not found" });

  if (active) {
    // Deactivate others
    sharedEngineState.wallets.forEach(w => w.isActive = false);
    wallet.isActive = true;
    sharedEngineState.walletAddress = wallet.address;
    logger.info({ address: wallet.address }, "[WALLET] Active execution account switched");
  } else {
    wallet.isActive = false;
  }

  res.json({ success: true, activeAddress: sharedEngineState.walletAddress });
});

/**
 * BSS-52: Update auto-withdrawal configuration
 */
router.post("/wallet/withdraw/config", async (req, res) => {
  const { enabled } = req.body;
  sharedEngineState.autoWithdrawEnabled = enabled;
  res.json({ success: true, autoWithdraw: enabled });
});

router.put("/wallet/config", async (req, res) => {
  const { rpcEndpoint, pimlicoApiKey, sweepMode } = req.body;
  const rows = await db.select().from(settingsTable).limit(1);

  const updates: Record<string, unknown> = {};
  if (rpcEndpoint !== undefined) updates.rpcEndpointMasked = rpcEndpoint.slice(-8);
  if (pimlicoApiKey !== undefined) updates.pimlicoApiKeyMasked = pimlicoApiKey.slice(-8);
  if (sweepMode !== undefined) updates.sweepMode = sweepMode;

  if (rows.length === 0) {
    await db.insert(settingsTable).values({ ...updates });
  } else {
    if (Object.keys(updates).length > 0) {
      await db.update(settingsTable).set(updates);
    }
  }

  res.json({ success: true, message: "Wallet config updated." });
});

export default router;
