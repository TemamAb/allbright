import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface Wallet {
  id: number;
  address: string;
  privateKey: string;
  chain: '1' | '8453' | '42161' | '10' | '137' | '43114' | '56' | '250';
  balance: string; // ETH
  isValid: boolean;
  active: boolean;
}

interface WalletContextType {
  wallets: Wallet[];
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>;
  totalBalance: number;
  addWallet: () => void;
  updateWallet: (id: number, updates: Partial<Wallet>) => void;
  deleteWallet: (id: number) => void;
  fetchBalance: (address: string, chain: Wallet['chain']) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

// Chain names map
const CHAIN_NAMES: Record<string, string> = {
  '1': 'Ethereum',
  '8453': 'Base',
  '42161': 'Arbitrum',
  '10': 'Optimism',
  '137': 'Polygon',
  '43114': 'Avalanche',
  '56': 'BSC',
  '250': 'Fantom',
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const addWallet = useCallback(() => {
    const newWallet: Wallet = {
      id: Date.now(),
      address: '',
      privateKey: '',
      chain: '1',
      balance: '0.0000',
      isValid: false,
      active: true,
    };
    setWallets(prev => [...prev, newWallet]);
  }, []);

  const updateWallet = useCallback((id: number, updates: Partial<Wallet>) => {
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWallet = useCallback((id: number) => {
    setWallets(prev => prev.filter(w => w.id !== id));
  }, []);

  const fetchBalance = useCallback(async (address: string, chain: Wallet['chain']) => {
    if (!address || !import.meta.env.VITE_API_BASE_URL) return;

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, chain }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const bal = (data as { balance?: string })?.balance ?? '0.0000';
        setWallets(prev => prev.map(w =>
          w.address.toLowerCase() === address.toLowerCase()
            ? { ...w, balance: bal }
            : w
        ));
      }
    } catch (e) {
      console.error('[Wallet] Balance fetch failed', e);
    }
  }, []);

  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => {
      const val = parseFloat(w.balance) || 0;
      return sum + val;
    }, 0);
  }, [wallets]);

  // Auto-fetch balances when wallet address/chain changes
  useMemo(() => {
    wallets.forEach(w => {
      if (w.address && w.chain) {
        fetchBalance(w.address, w.chain);
      }
    });
  }, [wallets.map(w => w.address + w.chain).join(','), fetchBalance]);

  return (
    <WalletContext.Provider value={{
      wallets,
      setWallets,
      totalBalance,
      addWallet,
      updateWallet,
      deleteWallet,
      fetchBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallets = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallets must be used within WalletProvider');
  return ctx;
};
