import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";
import { suggestCategory } from "@/utils/categories";
import { hapticSuccess, hapticLight } from "@/utils/haptics";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({ isOpen, onClose }: Props) {
  const { categories, addExpense } = useStore();

  // Manual form
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    const suggested = suggestCategory(val);
    if (suggested && !category) setCategory(suggested);
  };

  const handleSubmit = useCallback(() => {
    if (!amount || !description) return;
    addExpense({
      amount: parseFloat(amount),
      description,
      category: category || "misc",
      date,
      merchant: description.split(" ")[0],
    });
    hapticSuccess();
    setAmount("");
    setDescription("");
    setCategory("");
    setDate(new Date().toISOString().slice(0, 10));
    onClose();
  }, [amount, description, category, date, addExpense, onClose]);

  const resetAndClose = () => {
    setAmount(""); setDescription(""); setCategory("");
    setDate(new Date().toISOString().slice(0, 10));
    hapticLight();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[60] max-h-[90vh] overflow-auto"
          >
            <div className="p-6 pb-10 max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-stone-800">Add Expense</h2>
                <button
                  onClick={resetAndClose}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-500 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-stone-400 font-light">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-4 text-3xl font-semibold bg-stone-50 rounded-2xl border-0 focus:ring-2 focus:ring-sage-300 outline-none text-stone-800 placeholder:text-stone-300"
                    autoFocus
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-500 mb-2">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="What did you spend on?"
                  className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-0 focus:ring-2 focus:ring-sage-300 outline-none text-stone-800 placeholder:text-stone-300"
                />
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-500 mb-2">Category</label>
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 rounded-2xl text-left"
                >
                  <span className={category ? "text-stone-800" : "text-stone-400"}>
                    {category ? categories.find((c) => c.id === category)?.name : "Select category"}
                  </span>
                  <ChevronDown size={18} className="text-stone-400" />
                </button>
                <AnimatePresence>
                  {showCategoryPicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => { setCategory(cat.id); setShowCategoryPicker(false); hapticLight(); }}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                              category === cat.id
                                ? "bg-sage-100 text-sage-800 ring-1 ring-sage-300"
                                : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                            }`}
                          >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-500 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-0 focus:ring-2 focus:ring-sage-300 outline-none text-stone-800"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!amount || !description}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-sage-700 text-white rounded-2xl font-medium shadow-soft active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
              >
                <Check size={18} />
                Save Expense
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
