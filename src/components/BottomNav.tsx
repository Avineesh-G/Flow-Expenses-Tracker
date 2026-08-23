import { motion } from "framer-motion";
import { Home, PlusCircle, BarChart3, Calendar, Settings } from "lucide-react";
import type { View } from "@/types";
import { hapticLight } from "@/utils/haptics";

interface Props {
  current: View;
  onChange: (view: View) => void;
  onAdd: () => void;
}

const tabs: { id: View; icon: typeof Home; label: string }[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "insights", icon: BarChart3, label: "Insights" },
  { id: "tracker", icon: PlusCircle, label: "Expenses" },
  { id: "calendar", icon: Calendar, label: "Calendar" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function BottomNav({ current, onChange, onAdd }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-stone-200/60 px-6 pb-safe pt-2 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = current === tab.id;
          const Icon = tab.icon;

          if (tab.id === "tracker") {
            return (
              <button
                key={tab.id}
                onClick={() => {
                  hapticLight();
                  onAdd();
                }}
                className="relative -top-5 bg-sage-600 text-white p-4 rounded-full shadow-elevated active:scale-95 transition-transform"
              >
                <PlusCircle size={24} strokeWidth={2.5} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                hapticLight();
                onChange(tab.id);
              }}
              className="flex flex-col items-center gap-1 py-2 px-3 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 w-1 h-1 rounded-full bg-sage-600"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.5}
                className={isActive ? "text-sage-700" : "text-stone-400"}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-sage-700" : "text-stone-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
