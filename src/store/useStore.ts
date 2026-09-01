import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  Expense,
  Category,
  SavingsGoal,
  UserSettings,
} from "@/types";

const defaultCategories: Category[] = [
  {
    id: "food",
    name: "Food & Dining",
    icon: "utensils",
    color: "#7a8a64",
    keywords: ["swiggy", "zomato", "restaurant", "cafe", "food", "grocery", "mart"],
    budget: 0,
  },
  {
    id: "transport",
    name: "Transport",
    icon: "car",
    color: "#5e7a9b",
    keywords: ["uber", "ola", "metro", "petrol", "diesel", "bus", "train"],
    budget: 0,
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "shopping-bag",
    color: "#b8925a",
    keywords: ["amazon", "flipkart", "myntra", "mall", "store"],
    budget: 0,
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: "film",
    color: "#997474",
    keywords: ["netflix", "spotify", "movie", "theatre", "game"],
    budget: 0,
  },
  {
    id: "bills",
    name: "Bills & Utilities",
    icon: "zap",
    color: "#6b7b8c",
    keywords: ["electricity", "water", "internet", "phone", "recharge"],
    budget: 0,
  },
  {
    id: "health",
    name: "Health",
    icon: "heart",
    color: "#7a8a8a",
    keywords: ["pharmacy", "doctor", "hospital", "medical"],
    budget: 0,
  },
  {
    id: "education",
    name: "Education",
    icon: "book",
    color: "#8a7a9a",
    keywords: ["course", "book", "tuition", "class"],
    budget: 0,
  },
  {
    id: "misc",
    name: "Miscellaneous",
    icon: "more-horizontal",
    color: "#8a8a8a",
    keywords: [],
  },
];

const defaultSettings: UserSettings = {
  name: "",
  currency: "₹",
  email: "",
  hapticsEnabled: true,
  hapticsIntensity: "medium",
  reducedMotion: false,
  darkMode: false,
  emailDigest: "monthly",
  userType: undefined,
  pocketMoneyLimit: undefined,
  dailySpendLimit: undefined,
  title: undefined,
};

interface Store extends AppState {
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  setCurrentMonth: (month: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateBudget: (month: string, categoryId: string, amount: number) => void;
  updateIncome: (month: string, income: number) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, "id">) => void;
  updateSavingsGoal: (id: string, amount: number) => void;
  getSafeToSpend: () => { today: number; week: number; month: number; onTrack: boolean };
  getMonthlyStats: (month: string) => {
    total: number;
    byCategory: Record<string, number>;
    vsLastMonth: number;
    dailyAverage: number;
  };
  getUnusualSpending: () => { detected: boolean; multiplier: number; driver?: string } | null;
  getDuplicates: () => Expense[][];
  getUncategorized: () => Expense[];
  setExpenses: (expenses: Expense[]) => void;
  setBudgets: (budgets: AppState["budgets"]) => void;
  addImportedGmailId: (gmailId: string) => void;
  clearAllData: () => void;
  setCategoryBudgets: (categoryBudgets: Record<string, number>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: defaultCategories,
      budgets: [],
      savingsGoals: [],
      settings: defaultSettings,
      currentMonth: new Date().toISOString().slice(0, 7),
      importedGmailIds: [],

      addExpense: (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ expenses: [newExpense, ...state.expenses] }));
        return newExpense;
      },

      updateExpense: (id, updates) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      setCurrentMonth: (month) => set({ currentMonth: month }),

      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),

      updateBudget: (month, categoryId, amount) =>
        set((state) => {
          const existing = state.budgets.find((b) => b.month === month);
          if (existing) {
            return {
              budgets: state.budgets.map((b) =>
                b.month === month
                  ? {
                      ...b,
                      categoryBudgets: {
                        ...b.categoryBudgets,
                        [categoryId]: amount,
                      },
                    }
                  : b
              ),
            };
          }
          return {
            budgets: [
              ...state.budgets,
              {
                month,
                income: 0,
                fixedExpenses: 0,
                savingsTarget: 0,
                categoryBudgets: { [categoryId]: amount },
              },
            ],
          };
        }),

      updateIncome: (month, income) =>
        set((state) => {
          const existing = state.budgets.find((b) => b.month === month);
          if (existing) {
            return {
              budgets: state.budgets.map((b) =>
                b.month === month ? { ...b, income } : b
              ),
            };
          }
          return {
            budgets: [
              ...state.budgets,
              {
                month,
                income,
                fixedExpenses: 0,
                savingsTarget: 0,
                categoryBudgets: {},
              },
            ],
          };
        }),

      addSavingsGoal: (goal) =>
        set((state) => ({
          savingsGoals: [...state.savingsGoals, { ...goal, id: generateId() }],
        })),

      updateSavingsGoal: (id, amount) =>
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: g.currentAmount + amount }
              : g
          ),
        })),

      getSafeToSpend: () => {
        const { expenses, budgets, currentMonth, settings } = get();

        let available = 0;
        if (settings.userType === "student" && settings.pocketMoneyLimit) {
          const monthExpenses = expenses.filter((e) =>
            e.date.startsWith(currentMonth)
          );
          const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
          available = settings.pocketMoneyLimit - spent;
        } else {
          const budget = budgets.find((b) => b.month === currentMonth) || {
            income: 0,
            fixedExpenses: 0,
            savingsTarget: 0,
          };
          const monthExpenses = expenses.filter((e) =>
            e.date.startsWith(currentMonth)
          );
          const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
          available =
            budget.income - budget.fixedExpenses - budget.savingsTarget - spent;
        }

        const now = new Date();
        const daysInMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        ).getDate();
        const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
        const remainingWeeks = Math.max(1, Math.ceil(remainingDays / 7));

        const todayLimit = settings.userType === "student" && settings.dailySpendLimit
          ? Math.min(settings.dailySpendLimit, Math.max(0, available))
          : Math.max(0, Math.floor(available / remainingDays));

        return {
          today: todayLimit,
          week: Math.max(0, Math.floor(available / remainingWeeks)),
          month: Math.max(0, available),
          onTrack: available >= 0,
        };
      },

      getMonthlyStats: (month) => {
        const { expenses } = get();
        const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
        const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        const byCategory: Record<string, number> = {};
        monthExpenses.forEach((e) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
        });

        const lastMonth = new Date(month + "-01");
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthStr = lastMonth.toISOString().slice(0, 7);
        const lastMonthExpenses = expenses.filter((e) =>
          e.date.startsWith(lastMonthStr)
        );
        const lastTotal = lastMonthExpenses.reduce(
          (sum, e) => sum + e.amount,
          0
        );

        const daysInMonth = new Date(month + "-01").getDate();
        const dailyAverage = total / daysInMonth;

        return {
          total,
          byCategory,
          vsLastMonth: lastTotal > 0 ? ((total - lastTotal) / lastTotal) * 100 : 0,
          dailyAverage,
        };
      },

      getUnusualSpending: () => {
        const { expenses } = get();
        const today = new Date().toISOString().slice(0, 10);
        const todayExpenses = expenses.filter((e) => e.date === today);
        const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        if (todayTotal === 0) return null;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentExpenses = expenses.filter(
          (e) => new Date(e.date) >= thirtyDaysAgo && e.date !== today
        );
        const avgDaily =
          recentExpenses.length > 0
            ? recentExpenses.reduce((sum, e) => sum + e.amount, 0) / 30
            : 0;

        if (avgDaily === 0 || todayTotal < avgDaily * 2) return null;

        const multiplier = todayTotal / avgDaily;
        const byCategory: Record<string, number> = {};
        todayExpenses.forEach((e) => {
          byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
        });
        const driver = Object.entries(byCategory).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0];

        return { detected: true, multiplier, driver };
      },

      getDuplicates: () => {
        const { expenses } = get();
        const groups: Expense[][] = [];
        const processed = new Set<string>();

        expenses.forEach((e1) => {
          if (processed.has(e1.id)) return;
          const dups = expenses.filter((e2) => {
            if (e1.id === e2.id || processed.has(e2.id)) return false;
            const timeDiff = Math.abs(
              new Date(e1.createdAt).getTime() - new Date(e2.createdAt).getTime()
            );
            const sameMerchant =
              e1.merchant && e2.merchant && e1.merchant === e2.merchant;
            const sameAmount = Math.abs(e1.amount - e2.amount) < 1;
            return (
              sameAmount &&
              timeDiff < 86400000 &&
              (sameMerchant || e1.description === e2.description)
            );
          });

          if (dups.length > 0) {
            groups.push([e1, ...dups]);
            processed.add(e1.id);
            dups.forEach((d) => processed.add(d.id));
          }
        });

        return groups;
      },

      getUncategorized: () => {
        const { expenses, categories } = get();
        return expenses.filter(
          (e) => !categories.find((c) => c.id === e.category)
        );
      },

      setExpenses: (expenses) => set({ expenses }),

      setBudgets: (budgets) => set({ budgets }),

      addImportedGmailId: (gmailId) =>
        set((state) => ({
          importedGmailIds: [...(state.importedGmailIds || []), gmailId],
        })),

      clearAllData: () =>
        set({
          expenses: [],
          importedGmailIds: [],
        }),

      setCategoryBudgets: (categoryBudgets) =>
        set((state) => ({
          categories: state.categories.map((c) => ({
            ...c,
            budget: categoryBudgets[c.id] !== undefined ? categoryBudgets[c.id] : c.budget,
          })),
        })),
    }),
    {
      name: "flow-finance-store",
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        // V3: Remove Google Calendar integration, wipe all synced data for fresh start
        if (version < 3) {
          const state = persistedState as Record<string, unknown>;
          return {
            ...state,
            expenses: [],
            importedGmailIds: [],
            googleCalendarId: undefined,
            categories: defaultCategories,
            settings: {
              ...(state.settings as Record<string, unknown>),
              hapticsIntensity: "medium",
            },
          };
        }
        return persistedState as Record<string, unknown>;
      },
    }
  )
);
