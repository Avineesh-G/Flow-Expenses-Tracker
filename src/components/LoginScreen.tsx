import { motion } from "framer-motion";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { Leaf, Shield, RefreshCw } from "lucide-react";

export default function LoginScreen() {
  const { signIn, isLoading, error } = useGoogleAuth();

  const features = [
    {
      icon: Shield,
      title: "Your data, your control",
      desc: "Everything is saved to your own Google Calendar — we store nothing on any server.",
    },
    {
      icon: RefreshCw,
      title: "Syncs everywhere",
      desc: "Log in on any device and your expenses are always there.",
    },
    {
      icon: Leaf,
      title: "Clutter-free finance",
      desc: "Flow is designed to reduce financial anxiety, not add to it.",
    },
  ];

  return (
    <div className="min-h-screen bg-sage-50 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto">

      {/* Logo + wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center mb-12"
      >
        {/* Icon blob */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-sage-600 rounded-3xl flex items-center justify-center shadow-elevated mb-5"
        >
          <Leaf size={36} className="text-white" strokeWidth={1.5} />
        </motion.div>

        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Flow</h1>
        <p className="text-stone-500 text-sm mt-1 font-medium">Mindful money tracking</p>
      </motion.div>

      {/* Sign-in card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
        className="w-full bg-white rounded-3xl p-7 shadow-card mb-6"
      >
        <h2 className="text-lg font-semibold text-stone-800 mb-1">Get started</h2>
        <p className="text-sm text-stone-500 mb-7 leading-relaxed">
          Sign in with your Google account to track your expenses and sync them to your calendar.
        </p>

        {/* Google sign-in button */}
        <motion.button
          onClick={() => signIn()}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-5 bg-stone-800 hover:bg-stone-700 text-white rounded-2xl font-medium text-sm transition-colors shadow-soft disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <GoogleIcon />
          )}
          {isLoading ? "Signing in…" : "Continue with Google"}
        </motion.button>

        {/* Error state */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-xs text-center text-sand-700 bg-sand-50 rounded-xl px-3 py-2.5 leading-relaxed"
          >
            {error}
          </motion.p>
        )}

        {/* Mandatory login note */}
        <p className="mt-5 text-xs text-center text-stone-400 leading-relaxed">
          A Google account is required to use Flow.
          <br />
          No guest access — your data stays safe in your account.
        </p>
      </motion.div>

      {/* Feature list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="w-full space-y-3"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            className="flex items-start gap-4 bg-white/70 rounded-2xl px-4 py-3.5 shadow-soft"
          >
            <div className="w-8 h-8 rounded-xl bg-sage-100 flex items-center justify-center shrink-0 mt-0.5">
              <f.icon size={16} className="text-sage-600" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700">{f.title}</p>
              <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 text-xs text-stone-400 text-center"
      >
        Your expenses are stored in your Google Calendar.
        <br />
        Flow never sees or stores your financial data.
      </motion.p>
    </div>
  );
}

// Inline Google "G" SVG — avoids any image dependency
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#ffffff"
        fillOpacity="0.9"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#ffffff"
        fillOpacity="0.75"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#ffffff"
        fillOpacity="0.6"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#ffffff"
        fillOpacity="0.9"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
