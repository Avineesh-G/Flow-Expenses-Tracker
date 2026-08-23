import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertCircle, RefreshCw, Download, X } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useGoogleSync } from "@/hooks/useGoogleSync";
import { useState, useEffect } from "react";
import type { Expense } from "@/types";
import TransactionReviewModal from "./TransactionReviewModal";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export default function HomeScreen() {
  const { settings, getSafeToSpend, getUnusualSpending, expenses, budgets, currentMonth } = useStore();
  const { isSyncing, error, syncGmail, approveTransactions } = useGoogleSync();
  const [pendingTransactions, setPendingTransactions] = useState<Expense[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { isInstallable, isInstalled, install } = useInstallPrompt();
  const [installDismissed, setInstallDismissed] = useState(false);

  const handleSync = async () => {
    const transactions = await syncGmail();
    if (transactions && transactions.length > 0) {
      setPendingTransactions(transactions);
      setIsReviewModalOpen(true);
    } else {
      alert("No new transactions found in your Gmail inbox from the trusted senders.");
    }
  };

  useEffect(() => {
    const lastSyncMonth = localStorage.getItem("flow_last_sync_month");
    if (lastSyncMonth !== currentMonth) {
      // Auto-sync on first open of the month
      syncGmail().then((transactions) => {
        if (transactions && transactions.length > 0) {
          setPendingTransactions(transactions);
          setIsReviewModalOpen(true);
        }
      });
      localStorage.setItem("flow_last_sync_month", currentMonth);
    }
  }, [currentMonth, syncGmail]);

  const handleApprove = async (approved: Expense[]) => {
    await approveTransactions(approved);
    setIsReviewModalOpen(false);
    setPendingTransactions([]);
  };

  const safe = getSafeToSpend();
  const unusual = getUnusualSpending();

  const budget = budgets.find((b) => b.month === currentMonth);
  const isStudent = settings.userType === "student";
  const hasBudget = isStudent ? !!settings.pocketMoneyLimit : (budget && budget.income > 0);
  const projectedSavings = isStudent
    ? Math.max(0, safe.month)
    : (hasBudget ? Math.max(0, safe.month) : 0);

  const todayExpenses = expenses.filter(
    (e) => e.date === new Date().toISOString().slice(0, 10)
  );
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const showInstallBanner = isInstallable && !isInstalled && !installDismissed;

  return (
    <div className="px-5 pt-6 pb-32 max-w-md mx-auto">
      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="mb-4 flex items-center gap-3 bg-[#4e6645] text-white rounded-2xl px-4 py-3 shadow-md"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Download size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Install Flow App</p>
              <p className="text-xs text-white/70 leading-tight">Add to home screen for quick access</p>
            </div>
            <button
              onClick={install}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Install
            </button>
            <button
              onClick={() => setInstallDismissed(true)}
              className="text-white/60 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-start justify-between"
      >
        <div className="flex-1 flex flex-col items-center justify-center pt-2 pb-4">
          <p className="text-sage-600 text-[10px] font-bold tracking-[0.2em] mb-1">
            HELLO
          </p>
          <h1 className="text-xl font-semibold text-stone-800 tracking-tight">
            Mr. {settings.name || "There"}
          </h1>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isSyncing
              ? "bg-sage-100 text-sage-700 animate-pulse"
              : error
              ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
              : "bg-stone-50 text-stone-500 hover:bg-stone-100"
          }`}
          title="Sync latest transactions from Gmail"
        >
          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
          <span>{isSyncing ? "Syncing" : error ? "Sync Failed" : "Sync Gmail"}</span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative bg-white rounded-3xl p-6 shadow-card mb-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-sage-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-sand-100/50 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <p className="text-stone-500 text-sm font-medium mb-2 relative">
          Safe to Spend Today
        </p>
        <motion.p
          key={safe.today}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-stone-800 mb-3 relative tracking-tight"
        >
          ₹{safe.today.toLocaleString()}
        </motion.p>
        <p className="text-stone-500 text-sm leading-relaxed relative">
          {isStudent
            ? `You can spend approximately ₹${safe.today.toLocaleString()} today while staying within your monthly pocket money limit.`
            : `You can spend approximately ₹${safe.today.toLocaleString()} today while staying within your monthly savings target.`}
        </p>

        <div className="flex gap-4 mt-6 pt-6 border-t border-stone-100 relative">
          <div className="flex-1">
            <p className="text-xs text-stone-400 font-medium mb-1">This Week</p>
            <p className="text-lg font-semibold text-stone-700">
              ₹{safe.week.toLocaleString()}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-stone-400 font-medium mb-1">This Month</p>
            <p className="text-lg font-semibold text-stone-700">
              ₹{safe.month.toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {hasBudget && (isStudent || (safe.onTrack && projectedSavings > 0)) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 mb-6 text-sage-700 bg-sage-50 rounded-2xl px-4 py-3"
        >
          <TrendingUp size={16} />
          <span className="text-sm font-medium">
            {isStudent
              ? `You have ₹${projectedSavings.toLocaleString()} left of your pocket money this month`
              : `You&apos;re on track to save ₹${projectedSavings.toLocaleString()} this month`}
          </span>
        </motion.div>
      )}

      {unusual?.detected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-sand-50 border border-sand-200 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-sand-600 mt-0.5 shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-stone-700 mb-1">
                Unusual spending detected
              </p>
              <p className="text-sm text-stone-500 leading-relaxed">
                Your spending today is approximately{" "}
                {unusual.multiplier.toFixed(1)}× higher than your usual daily
                average.
                {unusual.driver &&
                  ` Most of the increase came from ${unusual.driver}.`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {todaySpent > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            Today&apos;s Spending
          </h3>
          <div className="space-y-2">
            {todayExpenses.map((expense) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl p-4 shadow-soft flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-stone-800">
                    {expense.description}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {expense.category}
                  </p>
                </div>
                <p className="font-semibold text-stone-700">
                  ₹{expense.amount.toLocaleString()}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <TransactionReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setPendingTransactions([]);
        }}
        transactions={pendingTransactions}
        onApprove={handleApprove}
        isSyncing={isSyncing}
      />
    </div>
  );
}
