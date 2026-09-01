import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { View } from "@/types";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { useStore } from "@/store/useStore";
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
import { useFirestoreSync } from "@/hooks/useFirestoreSync";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [showAdd, setShowAdd] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { isAuthenticated, user } = useGoogleAuth();
  const { settings, updateSettings } = useStore();

  // Wire up Firestore real-time sync
  useFirestoreSync();

  // Track whether this is the first time seeing isAuthenticated=true in this session
  const loginHandled = useRef(false);

  useEffect(() => {
    document.body.style.overscrollBehavior = "none";
  }, []);

  // Only show setup/welcome on actual LOGIN, not on page refresh
  useEffect(() => {
    if (isAuthenticated && !loginHandled.current) {
      loginHandled.current = true;
      const justLoggedIn = sessionStorage.getItem("flow_just_logged_in") === "true";
      if (justLoggedIn) {
        sessionStorage.removeItem("flow_just_logged_in");
        if (!settings.userType) {
          setShowSetup(true);
        } else {
          setShowWelcome(true);
        }
      }
    }
  }, [isAuthenticated, settings.userType]);

  // Sync Google profile into settings on login
  useEffect(() => {
    if (user) {
      updateSettings({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, updateSettings]);

  // Show login screen if not authenticated
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
