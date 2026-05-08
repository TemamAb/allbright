import { ArrowUpRight, ShieldCheck, Wallet, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, useApiMutation, useWalletState } from "@/lib/api";

export default function WalletPage() {
  const { data, isLoading, error, refetch } = useWalletState();

  const activateWallet = useApiMutation(
    (walletId: string) =>
      apiFetch("/api/wallet/activate", {
        method: "POST",
        body: JSON.stringify({ walletId, active: true }),
      }),
    {
      onSuccess: () => {
        toast.success("Active execution account switched");
        refetch();
      },
      onError: (err) => {
        toast.error("Failed to switch active wallet", {
          description: String(err),
        });
      },
    },
  );

  const setAutoWithdraw = useApiMutation(
    (enabled: boolean) =>
      apiFetch("/api/wallet/withdraw/config", {
        method: "POST",
        body: JSON.stringify({ enabled }),
      }),
    {
      onSuccess: (_data, enabled) => {
        toast.success(`Auto-Sweep ${enabled ? "enabled" : "disabled"}`);
        refetch();
      },
      onError: (err) => {
        toast.error("Failed to update auto-sweep", {
          description: String(err),
        });
      },
    },
  );

  const wallets = data?.wallets ?? [];
  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balanceEth || 0), 0);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">
            Vault Management
          </h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">
            Institutionally synchronized wallet state
          </p>
        </div>
        <div className="bg-ash-black border border-ash-border px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Total Liquidity
            </p>
            <p className="text-2xl font-black text-emerald-accent font-mono tabular-nums">
              {totalBalance.toFixed(4)} ETH
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-accent/10 flex items-center justify-center border border-emerald-accent/20">
            <Wallet className="text-emerald-accent" size={20} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs font-bold text-red-400 uppercase tracking-widest">
          Wallet state unavailable
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-ash-black border border-ash-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-5 border-b border-ash-border bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-cyan-accent" size={18} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                Authorized Signers
              </span>
            </div>
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
              Web Deployment
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-b border-ash-border/50 hover:bg-transparent">
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                    Address
                  </TableHead>
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-right">
                    Balance
                  </TableHead>
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-center">
                    Status
                  </TableHead>
                  <TableHead className="px-6 text-[10px] text-zinc-500 font-black uppercase tracking-widest text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-6 py-16 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                      Synchronizing signer registry...
                    </TableCell>
                  </TableRow>
                ) : wallets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-6 py-16 text-center text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                      No synchronized wallets detected
                    </TableCell>
                  </TableRow>
                ) : (
                  wallets.map((wallet) => (
                    <TableRow key={wallet.id} className="border-b border-ash-border/20 group hover:bg-white/[0.01]">
                      <TableCell className="px-6 py-4 font-mono text-xs text-white">
                        <div className="flex items-center gap-2">
                          {wallet.address.slice(0, 10)}...{wallet.address.slice(-6)}
                          <ArrowUpRight size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono text-emerald-accent font-bold">
                        {(wallet.balanceEth || 0).toFixed(4)} ETH
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge
                          className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            wallet.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700"
                          }`}
                        >
                          {wallet.isActive ? "ACTIVE" : "STANDBY"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={wallet.isActive || activateWallet.isPending}
                          onClick={() => activateWallet.mutate(wallet.id)}
                          className="text-[9px] font-black uppercase tracking-widest text-cyan-accent hover:text-white hover:bg-cyan-accent/10"
                        >
                          Set Active
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-ash-black border border-ash-border rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap size={16} className="text-emerald-accent" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Auto-Sweep
                </span>
              </div>
              <Switch
                checked={Boolean(data?.autoWithdraw)}
                onCheckedChange={(enabled) => setAutoWithdraw.mutate(enabled)}
                disabled={setAutoWithdraw.isPending}
                className="data-[state=checked]:bg-emerald-accent"
              />
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium uppercase tracking-tight">
              Profits exceeding threshold are routed according to the backend vault policy.
            </p>
          </div>

          <div className="bg-ash-black border border-ash-border rounded-2xl p-6 shadow-xl">
            <span className="text-[10px] font-black text-white uppercase tracking-widest block mb-4">
              Deployment Status
            </span>
            <div className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Active Address</span>
                <span className="text-white font-mono">
                  {data?.activeAddress
                    ? `${data.activeAddress.slice(0, 5)}...${data.activeAddress.slice(-4)}`
                    : "None"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Live Capable</span>
                <span className={data?.liveCapable ? "text-emerald-accent" : "text-amber-400"}>
                  {data?.liveCapable ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">ETH Spot</span>
                <span className="text-white font-mono">
                  {data?.ethPriceUsd ? `$${data.ethPriceUsd.toFixed(2)}` : "--"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-ash-border/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 text-zinc-500">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                Remote signer sync is backend-controlled in this deployment
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
