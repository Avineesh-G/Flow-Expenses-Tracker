import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { format, addMonths, subMonths, parseISO } from "date-fns";
import { hapticLight } from "@/utils/haptics";

export default function MonthlyTracker() {
  const { expenses, currentMonth, setCurrentMonth, categories } = useStore();
  const [filter, setFilter] = useState("");

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .filter((e) => !filter || e.category === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const stats = useStore.getState().getMonthlyStats(currentMonth);
  const monthDate = parseISO(currentMonth + "-01");

  const navigateMonth = (dir: number) => {
    hapticLight();
    const newDate = dir > 0 ? addMonths(monthDate, 1) : subMonths(monthDate, 1);
    setCurrentMonth(format(newDate, "yyyy-MM"));
  };

  return (
    <div className="px-5 pt-6 pb-32 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} className="text-stone-500" />
        </button>
        <h2 className="text-lg font-semibold text-stone-800">
          {format(monthDate, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ChevronRight size={20} className="text-stone-500" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-card mb-6"
      >
        <p className="text-sm text-stone-500 mb-1">Total Spent</p>
        <p className="text-3xl font-bold text-stone-800 mb-2">
          ₹{stats.total.toLocaleString()}
        </p>
        {stats.vsLastMonth !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm ${
              stats.vsLastMonth > 0 ? "text-amber-600" : "text-sage-600"
            }`}
          >
            {stats.vsLastMonth > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
            <span>{Math.abs(stats.vsLastMonth).toFixed(1)}% vs last month</span>
          </div>
        )}
      </motion.div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setFilter("")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !filter ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-600"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat.id ? "text-white" : "bg-stone-100 text-stone-600"
            }`}
            style={filter === cat.id ? { backgroundColor: cat.color } : {}}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {monthExpenses.map((expense, i) => {
            const cat = categories.find((c) => c.id === expense.category);
            return (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl p-4 shadow-soft flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: (cat?.color || "#ccc") + "15" }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat?.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">
                    {expense.description}
                  </p>
                  <p className="text-xs text-stone-400">
                    {format(parseISO(expense.date), "MMM d")}
                  </p>
                </div>
                <p className="font-semibold text-stone-700">
                  ₹{expense.amount.toLocaleString()}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

const TrendingUpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);
