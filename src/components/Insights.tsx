import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useStore } from "@/store/useStore";
import { GraduationCap, AlertCircle, Edit2, Trash2 } from "lucide-react";
import EditExpenseModal from "./EditExpenseModal";
import type { Expense } from "@/types";
import { format } from "date-fns";

const CATEGORY_RATIOS: Record<string, number> = {
  food: 0.30,
  bills: 0.20,
  transport: 0.15,
  shopping: 0.15,
  entertainment: 0.08,
  health: 0.06,
  education: 0.06,
};

export default function Insights() {
  const { categories, currentMonth, settings, expenses, deleteExpense } = useStore();
  const stats = useStore.getState().getMonthlyStats(currentMonth);
  const isStudent = settings.userType === "student";
  const pocketLimit = settings.pocketMoneyLimit ?? 0;
  
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const monthExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, currentMonth]);

  const handleDelete = (expense: Expense) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(expense.id);
    }
  };

  const pieData = useMemo(() => {
    return Object.entries(stats.byCategory)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          name: cat?.name || catId,
          value: amount,
          color: cat?.color || "#ccc",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [stats.byCategory, categories]);

  const budgetData = useMemo(() => {
    if (isStudent && pocketLimit > 0) {
      // For students: derive limit from either their set cat.budget or the proportional ratio
      return categories
        .filter((cat) => cat.id in CATEGORY_RATIOS)
        .map((cat) => {
          const spent = stats.byCategory[cat.id] || 0;
          // Use explicitly set budget if > 0, else derive from ratio
          const budget = (cat.budget && cat.budget > 0)
            ? cat.budget
            : Math.round(pocketLimit * (CATEGORY_RATIOS[cat.id] ?? 0));
          const percent = budget > 0 ? (spent / budget) * 100 : 0;
          return {
            id: cat.id,
            name: cat.name,
            color: cat.color,
            spent,
            budget,
            remaining: Math.max(0, budget - spent),
            percent,
          };
        });
    }

    // For others: only show categories with a budget explicitly set
    return categories
      .map((cat) => {
        const spent = stats.byCategory[cat.id] || 0;
        const budget = cat.budget || 0;
        const percent = budget > 0 ? (spent / budget) * 100 : 0;
        return {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          spent,
          budget,
          remaining: Math.max(0, budget - spent),
          percent,
        };
      })
      .filter((d) => d.budget > 0);
  }, [categories, stats, isStudent, pocketLimit]);

  const topCategories = [...pieData].slice(0, 3);

  return (
    <div className="px-5 pt-6 pb-32 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-stone-800 mb-6">Insights</h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-card mb-6"
      >
        <h3 className="text-sm font-semibold text-stone-700 mb-4">
          Spending Breakdown
        </h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString()}`}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-stone-400 text-sm">
            No data yet
          </div>
        )}

        <div className="space-y-2 mt-2">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-stone-600">{item.name}</span>
              </div>
              <span className="font-medium text-stone-800">
                ₹{item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-6 shadow-card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-stone-700">
            Budget Progress
          </h3>
          {isStudent && pocketLimit > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-sage-700 bg-sage-50 px-2.5 py-1 rounded-full">
              <GraduationCap size={11} />
              ₹{pocketLimit.toLocaleString()} / mo
            </div>
          )}
        </div>

        {budgetData.length > 0 ? (
          <div className="space-y-4">
            {budgetData.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-stone-600">{item.name}</span>
                  <span className="text-stone-800 font-medium">
                    ₹{item.spent.toLocaleString()} / ₹{item.budget.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(item.percent, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor:
                        item.percent > 90
                          ? "#d4a373"
                          : item.percent > 75
                          ? "#e9c46a"
                          : item.color || "#7a8a64",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center">
              <AlertCircle size={18} className="text-stone-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-600">No budgets set yet</p>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {isStudent
                  ? "Set your pocket money limit in Settings to see your budget progress here."
                  : "Add budgets per category from the Monthly Tracker to track your spending limits."}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {topCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-sage-50 rounded-2xl p-5 mb-6"
        >
          <h3 className="text-sm font-semibold text-sage-800 mb-3">
            Top Spending Areas
          </h3>
          <div className="space-y-2">
            {topCategories.map((cat, i) => (
              <p key={cat.name} className="text-sm text-sage-700">
                {i + 1}. {cat.name} — ₹{cat.value.toLocaleString()}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {monthExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            All Transactions
          </h3>
          <div className="space-y-2">
            {monthExpenses.map((expense) => {
              const cat = categories.find(c => c.id === expense.category);
              return (
                <div
                  key={expense.id}
                  className="bg-white rounded-2xl p-4 shadow-soft flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-stone-50">
                      {cat?.icon || "💵"}
                    </div>
                    <div>
                      <p className="font-medium text-stone-800 line-clamp-1">
                        {expense.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                        <span>{format(new Date(expense.date), "MMM d")}</span>
                        {expense.type && <span>• {expense.type}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className={`font-semibold ${expense.type === "credit" ? "text-sage-600" : "text-stone-700"}`}>
                      {expense.type === "credit" ? "+" : ""}₹{expense.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpenseToEdit(expense)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
                        title="Edit transaction"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete transaction"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <EditExpenseModal 
        expense={expenseToEdit} 
        isOpen={!!expenseToEdit} 
        onClose={() => setExpenseToEdit(null)} 
      />
    </div>
  );
}
