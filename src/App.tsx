import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { View } from "@/types";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { useStore } from "@/store/useStore";
import { useGoogleSync } from "@/hooks/useGoogleSync";
import BottomNav from "@/components/BottomNav";
import HomeScreen from "@/components/HomeScreen";
import MonthlyTracker from "@/components/MonthlyTracker";
import Insights from "@/components/Insights";
import CalendarView from "@/components/CalendarView";
import Settings from "@/components/Settings";
import AddExpenseModal from "@/components/AddExpenseModal";
import LoginScreen from "@/components/LoginScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import ProfileSetupScreen from "@/components/ProfileSetupScreen";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [showAdd, setShowAdd] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { isAuthenticated, user } = useGoogleAuth();
  const { settings, updateSettings } = useStore();
  const { syncFromCalendar } = useGoogleSync();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    document.body.style.overscrollBehavior = "none";
  }, []);

  // Detect the moment of login — show setup if new, otherwise welcome
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated.current) {
      if (!settings.userType) {
        setShowSetup(true);
      } else {
        setShowWelcome(true);
      }
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, settings.userType]);

  // Trigger calendar fetch once user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      syncFromCalendar();
    }
  }, [isAuthenticated, syncFromCalendar]);

  // Sync Google profile into settings on login
  useEffect(() => {
    if (user) {
      updateSettings({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, updateSettings]);

  // Show login screen if not authenticated — no bypass
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show setup screen if user is new
  if (showSetup && user) {
    return (
      <ProfileSetupScreen
        user={user}
        onComplete={() => {
          setShowSetup(false);
          setShowWelcome(true);
        }}
      />
    );
  }

  // Show welcome screen right after login
  if (showWelcome && user) {
    return (
      <WelcomeScreen
        user={user}
        onDone={() => setShowWelcome(false)}
      />
    );
  }

  const views: Record<View, React.ReactNode> = {
    home: <HomeScreen />,
    tracker: <MonthlyTracker />,
    insights: <Insights />,
    calendar: <CalendarView />,
    settings: <Settings />,
  };

  return (
    <div className="min-h-screen bg-sage-50 max-w-md mx-auto relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {views[view]}
        </motion.div>
      </AnimatePresence>

      <BottomNav current={view} onChange={setView} onAdd={() => setShowAdd(true)} />
      <AddExpenseModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
