import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  parseISO,
  getDay,
} from "date-fns";
import { hapticLight } from "@/utils/haptics";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { expenses, categories } = useStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

  const dailyTotals = useMemo(() => {
    const map: Record<
      string,
      { total: number; byCategory: Record<string, number> }
    > = {};
    expenses.forEach((e) => {
      if (!map[e.date]) map[e.date] = { total: 0, byCategory: {} };
      map[e.date].total += e.amount;
      map[e.date].byCategory[e.category] =
        (map[e.date].byCategory[e.category] || 0) + e.amount;
    });
    return map;
  }, [expenses]);

  const getSpendLevel = (total: number) => {
    if (!total) return null;
    if (total < 500) return "low";
    if (total < 2000) return "medium";
    return "high";
  };

  const selectedDayData = selectedDate ? dailyTotals[selectedDate] : null;

  return (
    <div className="px-5 pt-6 pb-32 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            hapticLight();
            setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
          }}
          className="p-2 hover:bg-stone-100 rounded-full"
        >
          <ChevronLeft size={20} className="text-stone-500" />
        </button>
        <h2 className="text-lg font-semibold text-stone-800">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <button
          onClick={() => {
            hapticLight();
            setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
          }}
          className="p-2 hover:bg-stone-100 rounded-full"
        >
          <ChevronRight size={20} className="text-stone-500" />
        </button>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-card">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="text-center text-xs font-medium text-stone-400 py-2"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const total = dailyTotals[dateStr]?.total || 0;
            const level = getSpendLevel(total);
            const isSelected = selectedDate === dateStr;
            const isTodayDate = isToday(day);

            return (
              <button
                key={dateStr}
                onClick={() => {
                  hapticLight();
                  setSelectedDate(isSelected ? null : dateStr);
                }}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all ${
                  isSelected
                    ? "bg-sage-100 ring-1 ring-sage-300"
                    : "hover:bg-stone-50"
                }`}
              >
                <span
                  className={`font-medium ${
                    isTodayDate ? "text-sage-700" : "text-stone-700"
                  }`}
                >
                  {format(day, "d")}
                </span>
                {level && (
                  <div
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      level === "low"
                        ? "bg-sage-400"
                        : level === "medium"
                        ? "bg-sand-400"
                        : "bg-rose-300"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDayData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-white rounded-2xl p-5 shadow-soft"
        >
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            {format(parseISO(selectedDate!), "MMMM d")}
          </h3>
          <p className="text-2xl font-bold text-stone-800 mb-3">
            ₹{selectedDayData.total.toLocaleString()}
          </p>
          <div className="space-y-2">
            {Object.entries(selectedDayData.byCategory).map(
              ([catId, amount]) => {
                const cat = categories.find((c) => c.id === catId);
                return (
                  <div
                    key={catId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat?.color }}
                      />
                      <span className="text-stone-600">
                        {cat?.name || catId}
                      </span>
                    </div>
                    <span className="font-medium">
                      ₹{amount.toLocaleString()}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </motion.div>
      )}

      {/* Monthly Report — Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: 0.1 }}
        className="mt-6 bg-white rounded-2xl p-5 shadow-soft border border-dashed border-sage-200"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-stone-700">
            Monthly Report — {format(currentDate, "MMMM yyyy")}
          </h3>
          <span className="text-[10px] font-bold bg-sage-100 text-sage-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
            Coming Soon
          </span>
        </div>
        <p className="text-xs text-stone-400 leading-relaxed">
          A full spending analysis for this month — category breakdown, daily averages, and savings summary — will be available here automatically on the 1st of each month.
        </p>
      </motion.div>
    </div>
  );
}

