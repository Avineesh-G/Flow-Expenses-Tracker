import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { GoogleUser } from "@/context/GoogleAuthContext";

interface Props {
  user: GoogleUser;
  onDone: () => void;
}

function getTitle(name: string): string {
  // We can't reliably know gender from a name, so just use their first name warmly
  return name.split(" ")[0];
}

export default function WelcomeScreen({ user, onDone }: Props) {
  const [stage, setStage] = useState<"hello" | "ready">("hello");

  useEffect(() => {
    // After 1.5s move to "ready" stage
    const t1 = setTimeout(() => setStage("ready"), 1500);
    // After 3s dismiss and go to the app
    const t2 = setTimeout(() => onDone(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className="min-h-screen bg-sage-50 flex flex-col items-center justify-center px-8 relative overflow-hidden">
      {/* Background decoration blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-sage-200/40 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sand-200/40 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="mb-6 relative inline-block"
        >
          <img
            src={user.picture}
            alt={user.name}
            className="w-24 h-24 rounded-full shadow-elevated ring-4 ring-white"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
            className="absolute -bottom-1 -right-1 bg-sage-600 text-white rounded-full p-1.5 shadow"
          >
            <Sparkles size={14} />
          </motion.div>
        </motion.div>

        {/* Greeting text */}
        <AnimatePresence mode="wait">
          {stage === "hello" ? (
            <motion.div
              key="hello"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <p className="text-stone-500 text-base font-medium mb-2 tracking-wide uppercase text-xs">
                Welcome back
              </p>
              <h1 className="text-3xl font-semibold text-stone-800 leading-tight">
                Hello, {getTitle(user.name)}! 👋
              </h1>
            </motion.div>
          ) : (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-stone-500 text-base font-medium mb-2 tracking-wide uppercase text-xs">
                All set
              </p>
              <h1 className="text-3xl font-semibold text-stone-800 leading-tight">
                Let's track your finances ✨
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-stone-400 text-sm mt-3"
        >
          {user.email}
        </motion.p>

        {/* Animated progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 w-48 mx-auto"
        >
          <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sage-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
