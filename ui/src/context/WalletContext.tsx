import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { useWalletBalance } from '@/lib/api';

interface Wallet {
  id: number;
  address: string;
  chain: '1' | '8453' | '42161' | '10' | '137' | '43114' | '56' | '250';
  balance: string; // ETH
  isValid: boolean;
  active: boolean;
}

interface WalletContextType {
  wallets: Wallet[];
  addWallet: () => void;
  updateWallet: (id: number, updates: Partial<Omit<Wallet, 'balance'>>) => void;
  deleteWallet: (id: number) => void;
  totalBalance: number;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const addWallet = useCallback(() => {
    const newWallet: Wallet = {
      id: Date.now(),
      address: '',
      chain: '1' as const,
      balance: '0.0000',
      isValid: false,
      active: true,
    };
    setWallets(prev => [...prev, newWallet]);
  }, []);

  const updateWallet = useCallback((id: number, updates: Partial<Omit<Wallet, 'balance'>>) => {
    setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWallet = useCallback((id: number) => {
    setWallets(prev => prev.filter(w => w.id !== id));
  }, []);

  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, w) => sum + parseFloat(w.balance || '0'), 0);
  }, [wallets]);

  // Auto-fetch balances using React Query hook (per wallet)
  // Balances managed by individual hooks in components via useWalletBalance

  return (
    <WalletContext.Provider value={{
      wallets,
      addWallet,
      updateWallet,
      deleteWallet,
      totalBalance,
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

