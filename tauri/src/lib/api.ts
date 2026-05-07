import { useState, useEffect } from 'react';

// API base URL - configurable for different environments
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'https://allbright-api.onrender.com';

export interface Wallet {
  id: string;
  address: string;
  balance: number;
  chain: string;
  isActive?: boolean;
}

export interface Trade {
  id: string;
  timestamp: Date;
  status: string;
  tokenIn: string;
  tokenOut: string;
  profit: string;
  bribePaid: string;
  latencyMs: string;
  txHash?: string;
}

export interface EngineStatus {
  running: boolean;
  mode: string;
  walletAddress?: string;
  ghostMode?: boolean;
}

// API hooks for Tauri frontend
export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchWallets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/wallet`);
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets || []);
        setTotalBalance(data.wallets?.reduce((sum: number, w: any) => sum + (w.balanceEth || 0), 0) || 0);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
    // Poll every 30 seconds for balance updates
    const interval = setInterval(fetchWallets, 30000);
    return () => clearInterval(interval);
  }, []);

  const addWallet = async () => {
    // Mock add wallet functionality
    alert('Wallet connection integration needed - would use WalletConnect/MetaMask');
  };

  const deleteWallet = async (id: string) => {
    // Mock delete wallet functionality
    setWallets(prev => prev.filter(w => w.id !== id));
  };

  return { wallets, addWallet, deleteWallet, totalBalance, loading };
}

export function useGetTrades(limit = 50) {
  const [data, setData] = useState<{ trades: Trade[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trades?limit=${limit}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
    // Poll every 10 seconds for new trades
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, [limit]);

  return { data, isLoading };
}

export function useGetTradesSummary() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trades/summary`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch trades summary:', error);
      }
    };

    fetchSummary();
    // Update every 30 seconds
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data };
}

export function useGetTradeStream() {
  const [data, setData] = useState<{ events: any[] }>({ events: [] });

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/trades/stream`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch trade stream:', error);
      }
    };

    fetchStream();
    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchStream, 2000);
    return () => clearInterval(interval);
  }, []);

  return { data };
}

export function useGetEngineStatus() {
  const [data, setData] = useState<EngineStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/engine/status`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch engine status:', error);
      }
    };

    fetchStatus();
    // Poll every 5 seconds for engine status
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return { data };
}