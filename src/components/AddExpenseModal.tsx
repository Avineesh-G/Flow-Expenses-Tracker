import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronDown, MessageSquare, Sparkles, AlertCircle } from "lucide-react";
import { useStore } from "@/store/useStore";
import { suggestCategory } from "@/utils/categories";
import { hapticSuccess, hapticLight } from "@/utils/haptics";
import { parseSMS } from "@/lib/smsParser";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "manual" | "sms";

export default function AddExpenseModal({ isOpen, onClose }: Props) {
  const { categories, addExpense } = useStore();
  const [tab, setTab] = useState<Tab>("manual");

  // Manual form
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // SMS tab
  const [smsText, setSmsText] = useState("");
  const [parsedSMS, setParsedSMS] = useState<ReturnType<typeof parseSMS>>(null);
  const [smsError, setSmsError] = useState("");
  const [smsCategory, setSmsCategory] = useState("");

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

  const handleParseSMS = () => {
    setSmsError("");
    const parsed = parseSMS(smsText);
    if (!parsed) {
      setSmsError("Couldn't read this message. Try a bank debit/credit SMS.");
      setParsedSMS(null);
      return;
    }
    setParsedSMS(parsed);
    const suggested = suggestCategory(parsed.merchant);
    setSmsCategory(suggested || (parsed.type === "credit" ? "income" : "misc"));
  };

  const handleSMSSubmit = () => {
    if (!parsedSMS) return;
    addExpense({
      amount: parsedSMS.amount,
      description: parsedSMS.merchant,
      category: smsCategory || "misc",
      date: parsedSMS.date,
      merchant: parsedSMS.merchant,
      type: parsedSMS.type,
    });
    hapticSuccess();
    setSmsText("");
    setParsedSMS(null);
    setSmsError("");
    onClose();
  };

  const resetAndClose = () => {
    setAmount(""); setDescription(""); setCategory("");
    setDate(new Date().toISOString().slice(0, 10));
    setSmsText(""); setParsedSMS(null); setSmsError("");
    setTab("manual");
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

              {/* Tab switcher */}
              <div className="flex gap-2 mb-6 bg-stone-100 rounded-2xl p-1">
                <button
                  onClick={() => setTab("manual")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === "manual"
                      ? "bg-white text-stone-800 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <Check size={15} />
                  Manual
                </button>
                <button
                  onClick={() => setTab("sms")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    tab === "sms"
                      ? "bg-white text-stone-800 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  <MessageSquare size={15} />
                  Paste SMS
                </button>
              </div>

              {tab === "manual" ? (
                <>
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
                </>
              ) : (
                /* === SMS TAB === */
                <>
                  <div className="mb-4 p-3.5 bg-sage-50 rounded-2xl border border-sage-100">
                    <p className="text-xs text-sage-700 leading-relaxed">
                      <span className="font-semibold">How to use:</span> Copy a transaction SMS from PhonePe, Google Pay, Paytm, or your bank, then paste it below. Flow will extract the details automatically.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-stone-500 mb-2">Paste SMS text</label>
                    <textarea
                      value={smsText}
                      onChange={(e) => { setSmsText(e.target.value); setParsedSMS(null); setSmsError(""); }}
                      placeholder={`Example:\nRs.150 debited from your account XXXX1234 on 01-09-26 for UPI txn ref 123456. UPI ID: merchant@paytm`}
                      rows={4}
                      className="w-full px-4 py-3 bg-stone-50 rounded-2xl border-0 focus:ring-2 focus:ring-sage-300 outline-none text-stone-800 placeholder:text-stone-300 text-sm resize-none"
                    />
                  </div>

                  {smsError && (
                    <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 rounded-xl">
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600">{smsError}</p>
                    </div>
                  )}

                  {!parsedSMS ? (
                    <button
                      onClick={handleParseSMS}
                      disabled={!smsText.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-stone-800 text-white rounded-2xl font-medium active:scale-95 transition-transform disabled:opacity-40"
                    >
                      <Sparkles size={18} />
                      Read SMS
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* Parsed result preview */}
                      <div className="p-4 bg-sage-50 rounded-2xl border border-sage-100 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-500">Amount</span>
                          <span className="text-sm font-bold text-stone-800">₹{parsedSMS.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-500">Merchant</span>
                          <span className="text-sm font-medium text-stone-700">{parsedSMS.merchant}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-500">Type</span>
                          <span className={`text-xs font-semibold uppercase tracking-wider ${parsedSMS.type === "credit" ? "text-sage-600" : "text-rose-500"}`}>
                            {parsedSMS.type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-stone-500">Date</span>
                          <span className="text-sm font-medium text-stone-700">{parsedSMS.date}</span>
                        </div>
                      </div>

                      {/* Category for SMS */}
                      <div>
                        <label className="block text-sm font-medium text-stone-500 mb-2">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSmsCategory("income")}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${smsCategory === "income" ? "bg-sage-100 text-sage-800 ring-1 ring-sage-300" : "bg-stone-50 text-stone-600"}`}
                          >
                            💰 Income
                          </button>
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setSmsCategory(cat.id)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${smsCategory === cat.id ? "bg-sage-100 text-sage-800 ring-1 ring-sage-300" : "bg-stone-50 text-stone-600"}`}
                            >
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleSMSSubmit}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-sage-700 text-white rounded-2xl font-medium shadow-soft active:scale-95 transition-transform"
                      >
                        <Check size={18} />
                        Save Transaction
                      </button>
                      <button
                        onClick={() => { setParsedSMS(null); setSmsText(""); }}
                        className="w-full text-sm text-stone-400 hover:text-stone-600 py-2"
                      >
                        Try a different SMS
                      </button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
