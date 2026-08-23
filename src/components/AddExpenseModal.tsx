import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Check, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";
import { suggestCategory } from "@/utils/categories";
import { hapticSuccess, hapticLight } from "@/utils/haptics";
import { useGoogleSync } from "@/hooks/useGoogleSync";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({ isOpen, onClose }: Props) {
  const { categories, addExpense, updateExpense } = useStore();
  const { pushExpense } = useGoogleSync();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    const suggested = suggestCategory(val);
    if (suggested && !category) setCategory(suggested);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      hapticSuccess();
      // Simulate receipt scanning for now
      setAmount("250");
      setDescription("Grocery store");
      setCategory("food");
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!amount || !description) return;

    const newExpense = addExpense({
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
    onClose();

    try {
      const updated = await pushExpense(newExpense);
      if (updated.googleCalendarEventId) {
        updateExpense(newExpense.id, {
          googleCalendarEventId: updated.googleCalendarEventId,
        });
      }
    } catch (e) {
      console.error("Failed to sync new expense to Google Calendar:", e);
    }
  }, [amount, description, category, date, addExpense, updateExpense, pushExpense, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-auto"
          >
            <div className="p-6 pb-24 max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-stone-800">
                  Add Expense
                </h2>
                <button
                  onClick={() => {
                    hapticLight();
                    onClose();
                  }}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-stone-500" />
                </button>
              </div>

              {!showScreenshot ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-stone-500 mb-2">
                      Amount
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-stone-400 font-light">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-4 text-3xl font-semibold bg-stone-50 rounded-2xl border-0 focus:ring-2 focus:ring-sage-300 outline-none text-stone-800 placeholder:text-stone-300"
                          autoFocus
                        />
                      </div>
                      <label className="flex items-center justify-center w-16 bg-stone-100 text-stone-500 hover:text-sage-700 hover:bg-sage-100 rounded-2xl cursor-pointer transition-colors shrink-0">
                        <Camera size={24} />
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleCameraCapture}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-stone-500 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      placeholder="What did you spend on?"
                      className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-0 focus:ring-2 focus:ring-sage-300 outline-none text-stone-800 placeholder:text-stone-300"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-stone-500 mb-2">
                      Category
                    </label>
                    <button
                      onClick={() =>
                        setShowCategoryPicker(!showCategoryPicker)
                      }
                      className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 rounded-2xl text-left"
                    >
                      <span
                        className={
                          category ? "text-stone-800" : "text-stone-400"
                        }
                      >
                        {category
                          ? categories.find((c) => c.id === category)?.name
                          : "Select category"}
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
                                onClick={() => {
                                  setCategory(cat.id);
                                  setShowCategoryPicker(false);
                                  hapticLight();
                                }}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                  category === cat.id
                                    ? "bg-sage-100 text-sage-800 ring-1 ring-sage-300"
                                    : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                                }`}
                              >
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-stone-500 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-0 focus:ring-2 focus:ring-sage-300 outline-none text-stone-800"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={!amount || !description}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-sage-700 text-white rounded-2xl font-medium shadow-soft active:scale-95 transition-transform disabled:opacity-40 disabled:active:scale-100"
                    >
                      <Check size={18} />
                      Save Expense
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-sage-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Camera size={32} className="text-sage-400" />
                  </div>
                  <h3 className="text-lg font-medium text-stone-700 mb-2">
                    Upload Screenshot
                  </h3>
                  <p className="text-sm text-stone-500 mb-6">
                    Upload a UPI payment screenshot to auto-fill details
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="screenshot"
                    onChange={() => {
                      setShowScreenshot(false);
                    }}
                  />
                  <label
                    htmlFor="screenshot"
                    className="inline-block px-6 py-3 bg-sage-700 text-white rounded-2xl font-medium cursor-pointer active:scale-95 transition-transform"
                  >
                    Choose Image
                  </label>
                  <button
                    onClick={() => setShowScreenshot(false)}
                    className="block mx-auto mt-4 text-sm text-stone-400 hover:text-stone-600"
                  >
                    Back to manual entry
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
