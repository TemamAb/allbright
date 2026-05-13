import React, { useState } from 'react';
import { Wallet, ArrowRight, Clock, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLiveTelemetry } from '../services/useLiveTelemetry';

// BSS-F: Multi-Sig Approval Modal Component
const MultiSigApprovalModal: React.FC<{
  request: { id: string; amountEth: number; chainId: number; toAddress: string; };
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  isAdmin: boolean;
}> = ({ request, onApprove, onReject, onClose, isAdmin }) => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
    <div className="bg-ash-dark border border-ash-border rounded-lg p-6 w-[480px] shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-amber-500" size={20} />
        <h3 className="text-sm font-black uppercase text-white tracking-widest">Multi-Sig Approval Required</h3>
      </div>
      <div className="bg-ash-black/40 rounded p-4 mb-4 space-y-2 text-xs">
        <div className="flex justify-between"><span className="text-ash-muted">Request ID</span><span className="text-white font-mono">{request.id}</span></div>
        <div className="flex justify-between"><span className="text-ash-muted">Amount</span><span className="text-white font-black">{request.amountEth} ETH</span></div>
        <div className="flex justify-between"><span className="text-ash-muted">Chain</span><span className="text-white font-mono">{request.chainId}</span></div>
        <div className="flex justify-between"><span className="text-ash-muted">Destination</span><span className="text-white font-mono truncate">{request.toAddress.slice(0,10)}...</span></div>
      </div>
      {isAdmin ? (
        <div className="flex gap-3">
          <button onClick={onApprove} className="flex-1 py-3 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-black text-xs uppercase hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <CheckCircle size={14} /> Approve
          </button>
          <button onClick={onReject} className="flex-1 py-3 rounded bg-red-500/10 text-red-500 border border-red-500/30 font-black text-xs uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <XCircle size={14} /> Reject
          </button>
        </div>
      ) : (
        <div className="text-center py-4 text-amber-500 text-xs font-black uppercase">
          Awaiting Admin Approval
        </div>
      )}
      <button onClick={onClose} className="w-full mt-3 py-2 text-ash-muted text-xs font-mono uppercase hover:text-white">Close</button>
    </div>
  </div>
);

export const VaultWithdrawalView: React.FC = () => {
  const { state } = useLiveTelemetry();
  const [amount, setAmount] = useState('');
  const [chainId, setChainId] = useState('1');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
const [pendingRequest, setPendingRequest] = useState<{id: string; amountEth: number; chainId: number; toAddress: string;} | null>(null);
  const [approving, setApproving] = useState(false);

  const isAdmin = state?.currentUserRole === 'ADMIN';

  const handleApprove = async () => {
    if (!pendingRequest) return;
    setApproving(true);
    try {
      const response = await fetch('/api/vault/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingRequest.id, approved: true }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Withdrawal approved");
        setPendingRequest(null);
      } else {
        toast.error(data.error || "Approval failed");
      }
    } catch {
      toast.error("Failed to connect to vault service");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!pendingRequest) return;
    setApproving(true);
    try {
      const response = await fetch('/api/vault/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pendingRequest.id, approved: false }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Withdrawal rejected");
        setPendingRequest(null);
      } else {
        toast.error(data.error || "Rejection failed");
      }
    } catch {
      toast.error("Failed to connect to vault service");
    } finally {
      setApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/vault/request-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountEth: parseFloat(amount),
          chainId: parseInt(chainId),
          toAddress: address,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.requiresApproval) {
          setPendingRequest({ id: data.requestId, amountEth: parseFloat(amount), chainId: parseInt(chainId), toAddress: address });
        }
        toast.success(data.message);
        setAmount('');
        setAddress('');
      } else {
        toast.error(data.error || "Withdrawal request failed");
      }
    } catch (err) {
      toast.error("Failed to connect to vault service");
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (req: any) => setPendingRequest({ id: req.id, amountEth: req.amountEth, chainId: req.chainId, toAddress: req.toAddress });

return (
    <div className="grid grid-cols-12 gap-6 p-4">
      {/* Multi-Sig Approval Modal */}
      {pendingRequest && (
        <MultiSigApprovalModal
          request={pendingRequest}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setPendingRequest(null)}
          isAdmin={isAdmin}
        />
      )}
      {/* Withdrawal Form */}
      <div className="col-span-5 bg-ash-dark border border-ash-border rounded-lg p-6 shadow-xl">
        <h2 className="text-sm font-black uppercase text-white mb-6 flex items-center gap-2 tracking-widest">
          <Wallet size={16} className="text-cyan-accent" /> Initiate Fund Egress
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-black text-ash-muted block mb-1">Target Network</label>
            <select 
              value={chainId} 
              onChange={e => setChainId(e.target.value)}
              className="w-full bg-ash-black border border-ash-border rounded p-2 text-xs text-white outline-none focus:border-cyan-accent"
            >
              <option value="1">Ethereum Mainnet</option>
              <option value="8453">Base</option>
              <option value="42161">Arbitrum</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-ash-muted block mb-1">Amount (ETH)</label>
            <input 
              type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full bg-ash-black border border-ash-border rounded p-2 text-xs text-white outline-none focus:border-cyan-accent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-ash-muted block mb-1">Destination Address</label>
            <input 
              type="text" value={address} onChange={e => setAddress(e.target.value)}
              className="w-full bg-ash-black border border-ash-border rounded p-2 text-xs text-white font-mono outline-none focus:border-cyan-accent"
              placeholder="0x..."
            />
          </div>

          <button 
            disabled={loading}
            className="w-full py-3 rounded bg-cyan-600/20 text-cyan-accent border border-cyan-500/30 font-black text-xs uppercase hover:bg-cyan-600 hover:text-white transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? 'Processing...' : 'Request Withdrawal'} <ArrowRight size={14} />
          </button>
        </form>
      </div>

      {/* Pending Requests Table */}
      <div className="col-span-7 bg-ash-dark border border-ash-border rounded-lg overflow-hidden flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-ash-border bg-ash-black/40">
          <h3 className="text-xs font-black uppercase text-ash-muted tracking-widest flex items-center gap-2">
            <Clock size={14} /> Pending Vault Operations
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-ash-black/60 text-[9px] uppercase text-ash-muted font-black border-b border-ash-border sticky top-0">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Chain</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ash-border/30 text-[11px]">
              {state?.pendingWithdrawals?.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-ash-muted italic font-mono uppercase">No active egress requests detected</td></tr>
              ) : state?.pendingWithdrawals?.map((req: any) => (
                <tr key={req.id} className="hover:bg-ash-black/40 transition-colors">
                  <td className="p-4 font-mono text-ash-muted">{new Date(req.timestamp).toLocaleTimeString()}</td>
                  <td className="p-4 font-black text-white">{req.amountEth} ETH</td>
                  <td className="p-4 text-ash-muted uppercase font-mono">{req.chainId}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                      req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};