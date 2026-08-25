import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRight, Wallet, ShoppingBag, FileText, Calendar, Trash2 } from "lucide-react";
import type { Expense } from "@/types";
import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactions: Expense[];
  onApprove: (approved: Expense[]) => void;
  isSyncing: boolean;
}

export default function TransactionReviewModal({ isOpen, onClose, transactions, onApprove, isSyncing }: Props) {
  const { categories } = useStore();
  const [editedTransactions, setEditedTransactions] = useState<Expense[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEditedTransactions(transactions);
    }
  }, [isOpen, transactions]);

  const handleCategoryChange = (index: number, newCategory: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], category: newCategory };
    setEditedTransactions(updated);
  };

  const handleRemove = (index: number) => {
    const updated = [...editedTransactions];
    updated.splice(index, 1);
    setEditedTransactions(updated);
  };

  const handleApproveAll = () => {
    onApprove(editedTransactions);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
        >
          {/* Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">Review Transactions</h2>
              <p className="text-sm text-stone-500">
                Found {transactions.length} new {transactions.length === 1 ? "transaction" : "transactions"} in Gmail
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSyncing}
              className="p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto p-2">
            {editedTransactions.length === 0 ? (
              <div className="p-10 text-center text-stone-500">
                <FileText className="mx-auto mb-3 opacity-20" size={48} />
                <p>No new transactions found.</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {editedTransactions.map((tx, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-stone-100 bg-white shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-full ${tx.type === "credit" ? "bg-sage-100 text-sage-600" : "bg-rose-50 text-rose-500"}`}>
                          {tx.type === "credit" ? <Wallet size={18} /> : <ShoppingBag size={18} />}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-800">{tx.merchant}</p>
                          <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                            <span className="flex items-center gap-1"><Calendar size={10} />{format(new Date(tx.date), "MMM d")}</span>
                            {tx.account && <span>• {tx.account}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.type === "credit" ? "text-sage-600" : "text-stone-800"}`}>
                          {tx.type === "credit" ? "+" : ""}₹{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-stone-400 mt-1 uppercase font-medium tracking-wider">{tx.type || "debit"}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-stone-50 mt-1">
                      <span className="text-xs font-medium text-stone-500 flex items-center gap-1.5">
                        <Check size={12} className="text-sage-500" />
                        Detected Category
                      </span>
                      <div className="flex items-center gap-2">
                        <select
                          value={tx.category}
                          onChange={(e) => handleCategoryChange(idx, e.target.value)}
                          className="text-sm bg-stone-50 border-none rounded-lg px-3 py-1.5 font-medium text-stone-700 focus:ring-0 focus:outline-none cursor-pointer"
                        >
                          <option value="income">💰 Income</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handleRemove(idx)}
                          className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Dismiss this transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {editedTransactions.length > 0 && (
            <div className="p-5 border-t border-stone-100 bg-white">
              <button
                onClick={handleApproveAll}
                disabled={isSyncing}
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSyncing ? (
                  <span className="flex items-center gap-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Saving...
                  </span>
                ) : (
                  <>
                    Approve & Save {editedTransactions.length} {editedTransactions.length === 1 ? "Transaction" : "Transactions"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
