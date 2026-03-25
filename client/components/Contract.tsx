"use client";

import { useState, useCallback, useEffect } from "react";
import {
  deposit,
  withdraw,
  getBalance,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21V9" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────

type Tab = "deposit" | "withdraw";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("deposit");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const loadBalance = useCallback(async () => {
    setIsLoadingBalance(true);
    try {
      const result = await getBalance(walletAddress || undefined);
      setBalance(result as bigint);
    } catch (err) {
      console.error("Failed to load balance:", err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [walletAddress, loadBalance]);

  const handleDeposit = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!amount.trim()) return setError("Enter an amount");
    const amountNum = BigInt(amount.trim());
    if (amountNum <= BigInt(0)) return setError("Amount must be greater than 0");
    setError(null);
    setIsProcessing(true);
    setTxStatus("Awaiting signature...");
    try {
      await deposit(walletAddress, amountNum);
      setTxStatus("Deposit successful!");
      setAmount("");
      await loadBalance();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, amount, loadBalance]);

  const handleWithdraw = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!amount.trim()) return setError("Enter an amount");
    const amountNum = BigInt(amount.trim());
    if (amountNum <= BigInt(0)) return setError("Amount must be greater than 0");
    if (balance !== null && amountNum > balance) return setError("Insufficient balance");
    setError(null);
    setIsProcessing(true);
    setTxStatus("Awaiting signature...");
    try {
      await withdraw(walletAddress, amountNum);
      setTxStatus("Withdrawal successful!");
      setAmount("");
      await loadBalance();
      setTimeout(() => setTxStatus(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsProcessing(false);
    }
  }, [walletAddress, amount, balance, loadBalance]);

  const formatBalance = (val: bigint | null): string => {
    if (val === null) return "—";
    return val.toLocaleString();
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "deposit", label: "Deposit", icon: <ArrowDownIcon />, color: "#34d399" },
    { key: "withdraw", label: "Withdraw", icon: <ArrowUpIcon />, color: "#fbbf24" },
  ];

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("successful") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                  <path d="M6 1v3" />
                  <path d="M10 1v3" />
                  <path d="M14 1v3" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Token Bridge</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <Badge variant="info" className="text-[10px]">Soroban</Badge>
          </div>

          {/* Balance Display */}
          <div className="border-b border-white/[0.06] px-6 py-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WalletIcon />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Bridge Balance</span>
                </div>
                <button
                  onClick={loadBalance}
                  disabled={isLoadingBalance || !walletAddress}
                  className={cn(
                    "p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-colors",
                    isLoadingBalance && "animate-spin"
                  )}
                >
                  <RefreshIcon />
                </button>
              </div>
              <div className="mt-3 text-2xl font-mono font-semibold text-white/90">
                {formatBalance(balance)} <span className="text-sm font-normal text-white/30">XLM</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Deposit */}
            {activeTab === "deposit" && (
              <div className="space-y-5">
                <MethodSignature name="deposit" params="(user: Address, amount: i128)" returns="-> ()" color="#34d399" />
                <Input
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to deposit"
                />
                {walletAddress ? (
                  <ShimmerButton onClick={handleDeposit} disabled={isProcessing} shimmerColor="#34d399" className="w-full">
                    {isProcessing ? <><SpinnerIcon /> Depositing...</> : <><ArrowDownIcon /> Deposit Tokens</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#34d399]/20 bg-[#34d399]/[0.03] py-4 text-sm text-[#34d399]/60 hover:border-[#34d399]/30 hover:text-[#34d399]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to deposit
                  </button>
                )}
              </div>
            )}

            {/* Withdraw */}
            {activeTab === "withdraw" && (
              <div className="space-y-5">
                <MethodSignature name="withdraw" params="(user: Address, amount: i128)" returns="-> ()" color="#fbbf24" />
                <Input
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                />
                {balance !== null && balance > BigInt(0) && (
                  <button
                    onClick={() => setAmount(balance.toString())}
                    className="text-xs text-white/30 hover:text-white/50 transition-colors"
                  >
                    Max: {formatBalance(balance)} XLM
                  </button>
                )}
                {walletAddress ? (
                  <ShimmerButton onClick={handleWithdraw} disabled={isProcessing} shimmerColor="#fbbf24" className="w-full">
                    {isProcessing ? <><SpinnerIcon /> Withdrawing...</> : <><ArrowUpIcon /> Withdraw Tokens</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#fbbf24]/20 bg-[#fbbf24]/[0.03] py-4 text-sm text-[#fbbf24]/60 hover:border-[#fbbf24]/30 hover:text-[#fbbf24]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to withdraw
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Token Bridge &middot; Soroban</p>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                <span className="font-mono text-[9px] text-white/15">Deposit</span>
              </span>
              <span className="text-white/10 text-[8px]">&rarr;</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#fbbf24]" />
                <span className="font-mono text-[9px] text-white/15">Withdraw</span>
              </span>
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
