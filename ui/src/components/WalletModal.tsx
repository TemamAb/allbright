import React, { useState } from 'react';
import { X, ChevronRight, Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Provider {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const providers: Provider[] = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', color: 'bg-orange-500' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '📱', color: 'bg-blue-500' },
  { id: 'trust', name: 'Trust Wallet', icon: '🔒', color: 'bg-green-500' },
  { id: 'phantom', name: 'Phantom', icon: '👻', color: 'bg-purple-500' },
  { id: 'ledger', name: 'Ledger', icon: '📱', color: 'bg-black' },
];

interface Account {
  address: string;
  balance: string;
  ens?: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (provider: string, account: Account) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onConnect }) => {
  const [step, setStep] = useState<'provider' | 'scanning' | 'accounts' | 'confirm'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleProviderSelect = async (provider: Provider) => {
    setSelectedProvider(provider);
    setStep('scanning');
    setIsLoading(true);

    try {
      // In production, integrate with actual wallet providers
      // For demo purposes, simulate wallet connection
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        // Check if MetaMask or similar is available
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        const mockAccounts: Account[] = accounts.map((addr: string, i: number) => ({
          address: addr,
          balance: `${(Math.random() * 5).toFixed(2)} ETH`,
          ens: i === 0 ? `${provider.name.toLowerCase()}.eth` : undefined
        }));
        setAccounts(mockAccounts);
      } else {
        // Fallback to demo accounts
        const mockAccounts: Account[] = [
          { address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', balance: '2.45 ETH' },
          { address: '0x8ba1f109551bD432803012645ac136ddd64DBA72', balance: '0.12 ETH' },
        ];
        setAccounts(mockAccounts);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      addToast('Failed to connect wallet', 'error');
      setStep('provider');
    } finally {
      setIsLoading(false);
      setStep('accounts');
    }
  };

  // Note: In production, import and use ethers.js or wagmi for proper wallet integration

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (selectedProvider && selectedAccount) {
      onConnect(selectedProvider.id, selectedAccount);
      onClose();
      resetModal();
    }
  };

  const resetModal = () => {
    setStep('provider');
    setSelectedProvider(null);
    setAccounts([]);
    setSelectedAccount(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    onClose();
    resetModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-ash-black border border-ash-border rounded-xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="text-cyan-accent" size={24} />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              Connect Wallet
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-ash-muted hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {step === 'provider' && (
            <>
              <p className="text-sm text-ash-muted mb-4">
                Select your wallet provider to connect
              </p>
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-ash-dark hover:bg-ash-dark/80 transition-colors border border-ash-border"
                  >
                    <div className={`w-8 h-8 rounded-full ${provider.color} flex items-center justify-center text-white text-sm`}>
                      {provider.icon}
                    </div>
                    <span className="text-sm font-medium text-white">{provider.name}</span>
                    <ChevronRight className="ml-auto text-ash-muted" size={16} />
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'scanning' && (
            <div className="text-center py-8">
              <Loader2 className="animate-spin text-cyan-accent mx-auto mb-4" size={32} />
              <p className="text-sm text-ash-muted mb-2">Scanning for accounts...</p>
              <p className="text-xs text-ash-muted/70">This may take a few seconds</p>
            </div>
          )}

          {step === 'accounts' && (
            <>
              <p className="text-sm text-ash-muted mb-4">
                Select an account to connect
              </p>
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.address}
                    onClick={() => handleAccountSelect(account)}
                    className="w-full p-3 rounded-lg bg-ash-dark hover:bg-ash-dark/80 transition-colors border border-ash-border text-left"
                  >
                    <div className="text-sm font-mono text-cyan-accent mb-1">
                      {account.address.slice(0, 6)}...{account.address.slice(-4)}
                    </div>
                    <div className="text-xs text-ash-muted">{account.balance}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'confirm' && selectedAccount && (
            <>
              <p className="text-sm text-ash-muted mb-4">
                Confirm wallet connection
              </p>
              <div className="p-4 rounded-lg bg-ash-dark border border-ash-border">
                <div className="text-sm font-mono text-cyan-accent mb-2">
                  {selectedAccount.address.slice(0, 6)}...{selectedAccount.address.slice(-4)}
                </div>
                <div className="text-xs text-ash-muted mb-4">{selectedAccount.balance}</div>
                <div className="text-xs text-ash-muted">
                  Provider: {selectedProvider?.name}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('accounts')}
                  className="flex-1 px-4 py-2 rounded-lg bg-ash-dark hover:bg-ash-dark/80 transition-colors text-sm font-medium text-ash-muted border border-ash-border"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-accent hover:bg-cyan-accent/90 transition-colors text-sm font-medium text-black"
                >
                  Connect
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;