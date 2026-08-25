import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Briefcase, ChevronRight, Check } from "lucide-react";
import { useStore } from "@/store/useStore";
import { hapticSuccess, hapticLight } from "@/utils/haptics";
import type { GoogleUser } from "@/context/GoogleAuthContext";

interface Props {
  user: GoogleUser;
  onComplete: () => void;
}

const CATEGORY_RATIOS: Record<string, number> = {
  food: 0.30,
  bills: 0.20,
  transport: 0.15,
  shopping: 0.15,
  entertainment: 0.08,
  health: 0.06,
  education: 0.06,
};

export default function ProfileSetupScreen({ user, onComplete }: Props) {
  const { categories, updateSettings, setCategoryBudgets, updateIncome, currentMonth } = useStore();
  const [selectedType, setSelectedType] = useState<"student" | "other" | null>(null);
  const [limit, setLimit] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({});
  const [showCategoryBudgets, setShowCategoryBudgets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLimitChange = (val: string) => {
    setLimit(val);
    setError(null);
    if (val) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        setDailyLimit(Math.round(num / 30).toString());

        // Proportional split keyed by category id
        const newBudgets: Record<string, string> = {};
        const catIds = Object.keys(CATEGORY_RATIOS); // matches defaultCategory ids exactly
        let sum = 0;
        catIds.forEach((catId, idx) => {
          if (idx === catIds.length - 1) {
            newBudgets[catId] = Math.max(0, num - sum).toString();
          } else {
            const amt = Math.round(num * CATEGORY_RATIOS[catId]);
            newBudgets[catId] = amt.toString();
            sum += amt;
          }
        });
        setCatBudgets(newBudgets);
      }
    } else {
      setDailyLimit("");
      setCatBudgets({});
    }
  };

  const handleSubmit = () => {
    if (!selectedType) {
      setError("Please select a profile type.");
      return;
    }

    if (selectedType === "other") {
      const numericIncome = parseFloat(limit);
      if (limit && (isNaN(numericIncome) || numericIncome < 0)) {
        setError("Please enter a valid monthly income.");
        return;
      }
      hapticSuccess();
      updateSettings({
        userType: "other",
        pocketMoneyLimit: undefined,
        dailySpendLimit: undefined,
      });
      if (numericIncome > 0) {
        updateIncome(currentMonth, numericIncome);
      }
    } else if (selectedType === "student") {
      const numericLimit = parseFloat(limit);
      const numericDailyLimit = parseFloat(dailyLimit);
      if (!limit || isNaN(numericLimit) || numericLimit <= 0) {
        setError("Please enter a valid pocket money limit.");
        return;
      }
      if (!dailyLimit || isNaN(numericDailyLimit) || numericDailyLimit <= 0) {
        setError("Please enter a valid daily spending limit.");
        return;
      }

      // Save category budgets keyed by category id
      const budgetsToSave: Record<string, number> = {};
      categories.forEach((cat) => {
        const val = catBudgets[cat.id];
        if (val !== undefined) {
          budgetsToSave[cat.id] = parseFloat(val) || 0;
        }
      });
      setCategoryBudgets(budgetsToSave);

      hapticSuccess();
      updateSettings({
        userType: "student",
        pocketMoneyLimit: numericLimit,
        dailySpendLimit: numericDailyLimit,
      });
    }

    onComplete();
  };

  return (
    <div className="min-h-screen bg-sage-50 flex flex-col justify-between px-6 py-10 max-w-md mx-auto relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sage-100/60 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-sand-100/60 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <img
            src={user.picture}
            alt={user.name}
            className="w-10 h-10 rounded-full ring-2 ring-white shadow-soft"
          />
          <div>
            <p className="text-[11px] font-semibold text-sage-600 tracking-wide uppercase">Setup profile</p>
            <h1 className="text-lg font-bold text-stone-800">Customize your flow</h1>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-stone-800 tracking-tight leading-tight mt-6"
        >
          Choose how you want to track your money
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-stone-500 text-sm mt-2 leading-relaxed"
        >
          Select the option that best fits your daily spending and saving goals.
        </motion.p>
      </div>

      {/* Profile Options */}
      <div className="space-y-4 my-8 relative z-10 flex-1 flex flex-col justify-center">
        {/* Option: Student */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => {
            hapticLight();
            setSelectedType("student");
            setError(null);
          }}
          className={`group rounded-3xl p-5 border-2 cursor-pointer transition-all ${
            selectedType === "student"
              ? "bg-white border-sage-600 shadow-elevated"
              : "bg-white/70 border-transparent hover:bg-white hover:shadow-soft"
          }`}
        >
          <div className="flex gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                selectedType === "student" ? "bg-sage-600 text-white" : "bg-sage-100 text-sage-700"
              }`}
            >
              <GraduationCap size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-800 text-base">Student</h3>
                {selectedType === "student" && (
                  <div className="w-5 h-5 rounded-full bg-sage-600 text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Set a monthly pocket money spending limit and sync Gmail transactions to track it automatically.
              </p>
            </div>
          </div>

          {/* Student limit inputs */}
          <AnimatePresence>
            {selectedType === "student" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-stone-100 overflow-hidden space-y-4"
                onClick={(e) => e.stopPropagation()} // Prevent card deselection when clicking input
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Monthly Pocket Money Limit (₹)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-stone-400 font-medium">₹</span>
                    <input
                      type="number"
                      pattern="[0-9]*"
                      value={limit}
                      onChange={(e) => handleLimitChange(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl py-3 pl-8 pr-4 text-stone-800 font-semibold text-sm focus:outline-none focus:border-sage-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-stone-600">
                      Daily Spending Limit (₹)
                    </label>
                    <span className="text-[10px] text-sage-600 font-medium bg-sage-50 px-2 py-0.5 rounded-full">
                      Recommended: Limit / 30
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-stone-400 font-medium">₹</span>
                    <input
                      type="number"
                      pattern="[0-9]*"
                      value={dailyLimit}
                      onChange={(e) => {
                        setDailyLimit(e.target.value);
                        setError(null);
                      }}
                      placeholder="e.g. 300"
                      className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl py-3 pl-8 pr-4 text-stone-800 font-semibold text-sm focus:outline-none focus:border-sage-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Category budgets breakdown */}
                {Object.keys(catBudgets).length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCategoryBudgets((p) => !p)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-stone-600 bg-stone-50 rounded-2xl px-4 py-2.5 hover:bg-stone-100 transition-colors"
                    >
                      <span>📊 Category Budget Split</span>
                      <span className="text-stone-400">{showCategoryBudgets ? "▲ hide" : "▼ adjust"}</span>
                    </button>

                    <AnimatePresence>
                      {showCategoryBudgets && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-2 space-y-2"
                        >
                          {categories
                            .filter((cat) => cat.id in CATEGORY_RATIOS)
                            .map((cat) => (
                              <div key={cat.id} className="flex items-center gap-3">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="text-xs text-stone-600 flex-1 truncate">{cat.name}</span>
                                <div className="relative w-28">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">₹</span>
                                  <input
                                    type="number"
                                    value={catBudgets[cat.id] ?? ""}
                                    onChange={(e) =>
                                      setCatBudgets((prev) => ({
                                        ...prev,
                                        [cat.id]: e.target.value,
                                      }))
                                    }
                                    className="w-full bg-white border border-stone-200 rounded-xl py-1.5 pl-6 pr-2 text-xs text-stone-800 font-semibold focus:outline-none focus:border-sage-500 transition-all"
                                  />
                                </div>
                              </div>
                            ))}
                          <p className="text-[10px] text-stone-400 pt-1 text-center">
                            You can adjust these anytime from the monthly tracker.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Option: Other */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => {
            hapticLight();
            setSelectedType("other");
            setError(null);
          }}
          className={`group rounded-3xl p-5 border-2 cursor-pointer transition-all ${
            selectedType === "other"
              ? "bg-white border-sage-600 shadow-elevated"
              : "bg-white/70 border-transparent hover:bg-white hover:shadow-soft"
          }`}
        >
          <div className="flex gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                selectedType === "other" ? "bg-sage-600 text-white" : "bg-sage-100 text-sage-700"
              }`}
            >
              <Briefcase size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-stone-800 text-base">Other (Professional / General)</h3>
                {selectedType === "other" && (
                  <div className="w-5 h-5 rounded-full bg-sage-600 text-white flex items-center justify-center">
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Sync without pre-set limits. Monitor custom budgets, check insights, and view daily summaries.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {selectedType === "other" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-stone-100 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                    Monthly Income (₹) <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-stone-400 font-medium">₹</span>
                    <input
                      type="number"
                      pattern="[0-9]*"
                      value={limit}
                      onChange={(e) => {
                        setLimit(e.target.value);
                        setError(null);
                      }}
                      placeholder="e.g. 50000"
                      className="w-full bg-stone-50 border border-stone-200/80 rounded-2xl py-3 pl-8 pr-4 text-stone-800 font-semibold text-sm focus:outline-none focus:border-sage-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-sand-50 border border-sand-200/50 rounded-2xl p-3.5 mb-4 text-xs text-sand-800 font-medium text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={handleSubmit}
          className="w-full bg-stone-800 hover:bg-stone-700 active:scale-98 text-white py-4 rounded-2xl font-semibold text-sm transition-all shadow-elevated flex items-center justify-center gap-2"
        >
          Continue
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}
