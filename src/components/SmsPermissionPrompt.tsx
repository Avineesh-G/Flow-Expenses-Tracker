import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ShieldCheck, X, Zap } from 'lucide-react';
import SmsReaderPlugin from '@/plugins/SmsReaderPlugin';
import { useSmsSync } from '@/hooks/useSmsSync';

interface Props {
  onDone: () => void;
}

export default function SmsPermissionPrompt({ onDone }: Props) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { initSync } = useSmsSync();

  const handleAllow = async () => {
    setIsRequesting(true);
    setError(null);
    try {
      const { granted } = await SmsReaderPlugin.requestPermission();
      if (granted) {
        // Kick off the background import immediately — no waiting
        initSync();
        onDone();
      } else {
        setError('Permission denied. You can enable it later in your phone settings.');
      }
    } catch {
      setError('Something went wrong. Tap "Skip" and try again later.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-sage-100 flex items-center justify-center mx-auto mb-5">
          <MessageSquare size={28} className="text-sage-700" />
        </div>

        <h2 className="text-xl font-semibold text-stone-800 text-center mb-2">
          Auto-track your spending
        </h2>
        <p className="text-stone-500 text-sm text-center leading-relaxed mb-6">
          Allow Flow to read bank SMS messages so your transactions are automatically added — no typing needed.
        </p>

        {/* Feature list */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap size={13} className="text-sage-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Instant auto-import</p>
              <p className="text-xs text-stone-400">Last 5 months of bank transactions imported automatically</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck size={13} className="text-sage-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">Private & secure</p>
              <p className="text-xs text-stone-400">Only bank messages are read. Raw SMS text is never stored.</p>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-rose-600 text-xs text-center mb-4 bg-rose-50 rounded-xl px-3 py-2">{error}</p>
        )}

        <button
          onClick={handleAllow}
          disabled={isRequesting}
          className="w-full bg-[#4e6645] text-white font-semibold py-3.5 rounded-2xl text-sm transition-all active:scale-[0.97] disabled:opacity-60 mb-3"
        >
          {isRequesting ? 'Requesting…' : 'Allow SMS Access'}
        </button>

        <button
          onClick={onDone}
          className="w-full flex items-center justify-center gap-1.5 text-stone-400 text-sm py-2"
        >
          <X size={13} />
          Skip for now (manual entry only)
        </button>
      </motion.div>
    </div>
  );
}
