import { motion } from "framer-motion";
import { Bell, Moon, Smartphone, User, LogOut } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import { hapticLight } from "@/utils/haptics";

export default function Settings() {
  const { settings, updateSettings, clearAllData, currentMonth, budgets, updateIncome } = useStore();
  const { user, signOut } = useGoogleAuth();

  const toggle = (key: keyof typeof settings) => {
    hapticLight();
    if (typeof settings[key] === "boolean") {
      updateSettings({ [key]: !settings[key] });
    }
  };

  return (
    <div className="px-5 pt-6 pb-32 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-stone-800 mb-6">Settings</h2>

      <div className="space-y-4">

        {/* Google Account card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 shadow-soft"
          >
            <h3 className="text-sm font-semibold text-stone-700 mb-4">Google Account</h3>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={user.picture}
                alt={user.name}
                className="w-11 h-11 rounded-full ring-2 ring-sage-100"
              />
              <div className="min-w-0">
                <p className="font-medium text-stone-800 text-sm truncate">{user.name}</p>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                hapticLight();
                signOut();
                clearAllData();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl text-sm font-medium transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 shadow-soft"
        >
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateSettings({ name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border-0 text-stone-800 focus:ring-2 focus:ring-sage-300 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => updateSettings({ email: e.target.value })}
                placeholder="for magic link login"
                className="w-full px-3 py-2 bg-stone-50 rounded-xl border-0 text-stone-800 focus:ring-2 focus:ring-sage-300 outline-none placeholder:text-stone-300"
              />
            </div>
            {settings.userType === "student" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-stone-500 mb-1 block">Pocket Money (₹)</label>
                  <input
                    type="number"
                    value={settings.pocketMoneyLimit || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateSettings({
                        pocketMoneyLimit: val || undefined,
                        dailySpendLimit: val > 0 ? Math.round(val / 30) : undefined,
                      });
                    }}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border-0 text-stone-800 focus:ring-2 focus:ring-sage-300 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-500 mb-1 block">Daily Limit (₹)</label>
                  <input
                    type="number"
                    value={settings.dailySpendLimit || ""}
                    onChange={(e) => updateSettings({ dailySpendLimit: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-stone-50 rounded-xl border-0 text-stone-800 focus:ring-2 focus:ring-sage-300 outline-none"
                  />
                </div>
              </div>
            )}
            {settings.userType === "other" && (
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={budgets.find(b => b.month === currentMonth)?.income || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateIncome(currentMonth, val);
                  }}
                  className="w-full px-3 py-2 bg-stone-50 rounded-xl border-0 text-stone-800 focus:ring-2 focus:ring-sage-300 outline-none"
                />
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-soft"
        >
          <h3 className="text-sm font-semibold text-stone-700 mb-4">
            Preferences
          </h3>
          <div className="space-y-3">
            {/* Haptic Feedback toggle */}
            <div>
              <SettingRow
                icon={Smartphone}
                label="Haptic Feedback"
                value={settings.hapticsEnabled}
                onToggle={() => toggle("hapticsEnabled")}
              />
              {/* Intensity sub-section — only visible when haptics is ON */}
              {settings.hapticsEnabled && (
                <div className="mt-3 ml-7 flex gap-2">
                  {(["medium", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        hapticLight();
                        updateSettings({ hapticsIntensity: level });
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                        (settings.hapticsIntensity ?? "medium") === level
                          ? "bg-sage-600 text-white shadow-sm"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <SettingRow
              icon={Moon}
              label="Dark Mode"
              value={settings.darkMode}
              onToggle={() => toggle("darkMode")}
            />
            <SettingRow
              icon={Bell}
              label="Email Digest"
              value={settings.emailDigest !== "never"}
              onToggle={() => toggle("emailDigest" as any)}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-sage-50 rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-sage-800 mb-2">
            About Flow
          </h3>
          <p className="text-sm text-sage-600 leading-relaxed">
            Flow is designed to reduce financial anxiety, not add to it. Your
            data is stored locally on your device by default.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  value,
  onToggle,
}: {
  icon: typeof User;
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-stone-400" />
        <span className="text-sm text-stone-700">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative ${
          value ? "bg-sage-500" : "bg-stone-200"
        }`}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
