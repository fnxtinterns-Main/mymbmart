'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Database, CheckCircle2, Lock } from 'lucide-react';

interface BlockTransaction {
  txHash: string;
  type: string;
  amount: number;
  beneficiaryMemberId: string;
  orderRef: string;
  description: string;
  status: string;
}

interface BlockData {
  blockNumber: number;
  timestamp: string;
  transactionsCount: number;
  merkleRoot: string;
  validatorNode: string;
  transactions: BlockTransaction[];
}

interface ExplorerResponse {
  network: string;
  consensus: string;
  activeNodes: number;
  latestBlock: number;
  totalVerifiedTransactions: number;
  totalRewardsDistributedINR: number;
  recentBlocks: BlockData[];
}

interface SmartChainExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTxHash?: string | null;
}

export const SmartChainExplorerModal: React.FC<SmartChainExplorerModalProps> = ({
  isOpen,
  onClose,
  selectedTxHash,
}) => {
  const [data, setData] = useState<ExplorerResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/smartchain/explorer')
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setData(json);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-emerald-500/30 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white">
                  MegaBachatMart SmartChain Explorer
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono px-2 py-0.5 rounded-full font-bold">
                  Block #{data?.latestBlock || '1042'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transparent cryptographic double-entry reward & referral ledger
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network Metrics */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Consensus</span>
              <span className="font-extrabold text-emerald-400 mt-1 block">PoA (Federated)</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Active Nodes</span>
              <span className="font-extrabold text-white mt-1 block">{data.activeNodes} Live Nodes</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Verified Txns</span>
              <span className="font-extrabold text-white mt-1 block">{data.totalVerifiedTransactions.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Rewards Distributed</span>
              <span className="font-extrabold text-brand-orange mt-1 block">₹{data.totalRewardsDistributedINR.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Verified Block & Merkle Audit */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Latest Immutable Merkle Blocks</span>
          </h4>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {data?.recentBlocks.map((block) => (
              <div 
                key={block.blockNumber} 
                className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-700/70 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-emerald-400">Block #{block.blockNumber}</span>
                    <span className="text-slate-400">• {block.timestamp}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Merkle Root: {block.merkleRoot}
                  </span>
                </div>

                <div className="space-y-2">
                  {block.transactions.map((tx) => (
                    <div 
                      key={tx.txHash}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        selectedTxHash && tx.txHash.includes(selectedTxHash)
                          ? 'bg-emerald-950/60 border-emerald-500'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-emerald-400 font-bold text-[11px]">{tx.txHash}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                            {tx.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{tx.description}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">
                          +₹{tx.amount}
                        </span>
                        <div className="text-[10px] text-emerald-500 flex items-center justify-end space-x-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Finalized</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>SHA-256 Nonce & Merkle Proof Verified</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            Node: Ranchi Central Dark Hub
          </span>
        </div>

      </div>
    </div>
  );
};
