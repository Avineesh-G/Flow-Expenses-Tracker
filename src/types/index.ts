export interface Expense {
  id: string;
  type?: "credit" | "debit";
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  account?: string;
  reference?: string;
  isRecurring?: boolean;
  merchant?: string;
  gmailMessageId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
  keywords: string[];
}

export interface MonthlyBudget {
  month: string; // YYYY-MM
  income: number;
  fixedExpenses: number;
  savingsTarget: number;
  categoryBudgets: Record<string, number>;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface UserSettings {
  name: string;
  currency: string;
  email: string;
  hapticsEnabled: boolean;
  hapticsIntensity: "medium" | "high";
  reducedMotion: boolean;
  darkMode: boolean;
  emailDigest: "weekly" | "monthly" | "never";
  userType?: "student" | "other";
  pocketMoneyLimit?: number;
  dailySpendLimit?: number;
  title?: "Mr." | "Mrs." | "Ms." | "None";
}

export type View = "home" | "tracker" | "insights" | "calendar" | "settings";

export interface AppState {
  expenses: Expense[];
  categories: Category[];
  budgets: MonthlyBudget[];
  savingsGoals: SavingsGoal[];
  settings: UserSettings;
  currentMonth: string;
  importedGmailIds?: string[];
}
