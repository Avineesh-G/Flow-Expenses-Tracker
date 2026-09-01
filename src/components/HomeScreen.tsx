import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, AlertCircle, Download, X, Leaf, TrendingDown } from "lucide-react";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";
import { useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const SAVING_QUOTES = [
  "You saved today's budget! Every rupee saved is a rupee earned. ",
  "Amazing! You didn't spend a single rupee today. Keep it up!",
  "Today's a win! You held back and your wallet thanks you. 💪",
  "No spending today — you're building a great habit!",
  "Fantastic discipline today! Small steps lead to big savings.",
];

const UNDER_LIMIT_QUOTES = [
  "Great job staying within your limit today! 🎉",
  "Smart spending! You're well within budget.",
  "You're crushing it — spending wisely and staying on track!",
  "Budget champion! Keep this pace up for the whole month.",
  "Well done! Every day you spend smart adds up to a better future.",
];

const OVER_LIMIT_QUOTES = [
  "You went a bit over today — tomorrow is a fresh start! 💙",
  "It happens! Small overspends are recoverable. Cut back a little tomorrow.",
  "Today was tough, but you're aware — that's the first step to doing better.",
  "No worries! Balance it out over the next few days.",
  "You've got this. Stay mindful tomorrow and you'll be back on track.",
];

function getDailyQuote(quotes: string[]) {
  const day = new Date().getDate();
  return quotes[day % quotes.length];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
};

export default function HomeScreen() {
  const { settings, getSafeToSpend, getUnusualSpending, expenses, budgets, currentMonth } = useStore();
  const { isInstallable, isInstalled, install } = useInstallPrompt();
  const [installDismissed, setInstallDismissed] = useState(false);

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
  const dailyLimit = settings.dailySpendLimit || 0;

  const showInstallBanner = isInstallable && !isInstalled && !installDismissed;

  // Determine which quote + state to show
  const spentNothing = todaySpent === 0;
  const withinLimit = dailyLimit > 0 && todaySpent <= dailyLimit;
  const overLimit = dailyLimit > 0 && todaySpent > dailyLimit;

  const quoteText = spentNothing
    ? getDailyQuote(SAVING_QUOTES)
    : withinLimit
    ? getDailyQuote(UNDER_LIMIT_QUOTES)
    : overLimit
    ? getDailyQuote(OVER_LIMIT_QUOTES)
    : null;

  const quoteColor = spentNothing
    ? "bg-sage-50 text-sage-700 border-sage-100"
    : withinLimit
    ? "bg-sage-50 text-sage-700 border-sage-100"
    : "bg-sand-50 text-sand-800 border-sand-200";

  const QuoteIcon = spentNothing || withinLimit ? Leaf : TrendingDown;

  return (
    <div className="px-5 pt-6 pb-32 max-w-md mx-auto overflow-y-auto">

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

      {/* Header: Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <p className="text-stone-500 text-sm font-medium mb-1">
          {format(new Date(), "EEEE, MMMM d")}
        </p>
        <h1 className="text-2xl font-semibold text-stone-800">
          Good {getGreeting()}{settings.name ? `, ${settings.name}` : ""}
        </h1>
      </motion.div>

      {/* Safe to Spend Card */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        whileInView="animate"
        className="relative bg-white rounded-3xl p-6 shadow-card mb-6 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-sage-100/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-sand-100/50 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        <div className="flex items-baseline justify-between relative mb-1">
          <p className="text-stone-500 text-sm font-medium">Safe to Spend Today</p>
          {dailyLimit > 0 && (
            <p className="text-xs text-stone-400 font-medium">
              Limit: ₹{dailyLimit.toLocaleString()}
            </p>
          )}
        </div>
        <motion.p
          key={safe.today}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-stone-800 mb-3 relative tracking-tight"
        >
          ₹{Math.max(0, safe.today).toLocaleString()}
        </motion.p>
        <p className="text-stone-500 text-sm leading-relaxed relative">
          {isStudent
            ? `Spend up to ₹${Math.max(0, safe.today).toLocaleString()} today while staying within your monthly pocket money limit.`
            : `You can spend approximately ₹${Math.max(0, safe.today).toLocaleString()} today while staying within your monthly savings target.`}
        </p>

        <div className="flex gap-4 mt-6 pt-6 border-t border-stone-100 relative">
          <div className="flex-1">
            <p className="text-xs text-stone-400 font-medium mb-1">This Week</p>
            <p className="text-lg font-semibold text-stone-700">
              ₹{Math.max(0, safe.week).toLocaleString()}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-stone-400 font-medium mb-1">This Month</p>
            <p className="text-lg font-semibold text-stone-700">
              ₹{Math.max(0, safe.month).toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Daily quote card */}
      {quoteText && (
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.15 }}
          whileInView="animate"
          className={`flex items-start gap-3 mb-6 rounded-2xl px-4 py-3 border ${quoteColor}`}
        >
          <QuoteIcon size={16} className="mt-0.5 shrink-0" />
          <span className="text-sm font-medium leading-relaxed">{quoteText}</span>
        </motion.div>
      )}

      {/* On-track savings banner */}
      {hasBudget && (isStudent || (safe.onTrack && projectedSavings > 0)) && (
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.2 }}
          whileInView="animate"
          className="flex items-center gap-2 mb-6 text-sage-700 bg-sage-50 rounded-2xl px-4 py-3"
        >
          <TrendingUp size={16} />
          <span className="text-sm font-medium">
            {isStudent
              ? `₹${projectedSavings.toLocaleString()} left of your pocket money this month`
              : `On track to save ₹${projectedSavings.toLocaleString()} this month`}
          </span>
        </motion.div>
      )}

      {/* Unusual spending alert */}
      {unusual?.detected && (
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.25 }}
          whileInView="animate"
          className="bg-sand-50 border border-sand-200 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-sand-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-stone-700 mb-1">Unusual spending detected</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                Your spending today is approximately {unusual.multiplier.toFixed(1)}× higher than your usual daily average.
                {unusual.driver && ` Most of the increase came from ${unusual.driver}.`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Today's spending list */}
      {todaySpent > 0 && (
        <motion.div
          {...fadeUp}
          transition={{ delay: 0.3 }}
          whileInView="animate"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-700">Today&apos;s Spending</h3>
            <span className="text-sm font-semibold text-stone-800">
              ₹{todaySpent.toLocaleString()}
              {dailyLimit > 0 && (
                <span className="text-xs font-normal text-stone-400 ml-1">/ ₹{dailyLimit.toLocaleString()}</span>
              )}
            </span>
          </div>
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
                  <p className="font-medium text-stone-800">{expense.description}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{expense.category}</p>
                </div>
                <p className="font-semibold text-stone-700">₹{expense.amount.toLocaleString()}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
