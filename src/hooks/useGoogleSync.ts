import { useState, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import {
  getOrCreateFlowCalendar,
  fetchExpensesFromCalendar,
  createExpenseEvent,
  deleteExpenseEvent,
  updateDailySummaryEvent,
  fetchTransactionEmails,
  parseEmailToExpense,
} from "@/lib/googleApi";
import type { Expense } from "@/types";

export function useGoogleSync() {
  const { accessToken, isAuthenticated, user } = useGoogleAuth();
  const {
    expenses,
    googleCalendarId,
    importedGmailIds,
    setExpenses,
    setGoogleCalendarId,
    addImportedGmailId,
  } = useStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Sync entire state from Google Calendar (Initial load)
  const syncFromCalendar = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;
    setIsSyncing(true);
    setError(null);
    try {
      const currentStoreSettings = useStore.getState().settings;
      let activeCalendarId = googleCalendarId;

      if (user && currentStoreSettings.email && currentStoreSettings.email !== user.email) {
        useStore.getState().clearAllData();
        activeCalendarId = undefined;
      }

      // Find or create "Flow Expenses" Calendar
      const calId = activeCalendarId || (await getOrCreateFlowCalendar(accessToken));
      if (!activeCalendarId) {
        setGoogleCalendarId(calId);
      }

      // Fetch expenses
      const fetchedExpenses = await fetchExpensesFromCalendar(accessToken, calId);
      setExpenses(fetchedExpenses);
      setLastSynced(new Date());
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to sync expenses from Google Calendar");
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, accessToken, googleCalendarId, setGoogleCalendarId, setExpenses, user]);

  // Fetch transaction emails and return parsed expenses WITHOUT saving
  const syncGmail = useCallback(async (): Promise<Expense[]> => {
    if (!isAuthenticated || !accessToken) return [];
    setIsSyncing(true);
    setError(null);
    try {
      const emails = await fetchTransactionEmails(accessToken);
      const parsedExpenses: Expense[] = [];
      const currentImported = new Set(importedGmailIds || []);

      for (const email of emails) {
        if (currentImported.has(email.id)) continue;

        const parsed = parseEmailToExpense(email);
        if (parsed) {
          const newExpense: Expense = {
            ...parsed,
            id: Math.random().toString(36).substring(2, 9),
            createdAt: new Date().toISOString(),
          };
          parsedExpenses.push(newExpense);
        }
      }
      return parsedExpenses;
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to sync transactions from Gmail");
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, [
    isAuthenticated,
    accessToken,
    importedGmailIds,
  ]);

  // Save approved transactions to Calendar and store
  const approveTransactions = useCallback(async (approvedExpenses: Expense[]) => {
    if (!isAuthenticated || !accessToken || approvedExpenses.length === 0) return;
    setIsSyncing(true);
    try {
      const calId = googleCalendarId || (await getOrCreateFlowCalendar(accessToken));
      if (!googleCalendarId) {
        setGoogleCalendarId(calId);
      }

      const finalExpenses = [...approvedExpenses];

      for (const expense of finalExpenses) {
        // Save to Calendar
        const eventId = await createExpenseEvent(accessToken, calId, expense);
        expense.googleCalendarEventId = eventId;
        
        if (expense.gmailMessageId) {
          addImportedGmailId(expense.gmailMessageId);
        }
      }

      // Prepend to local expenses
      setExpenses([...finalExpenses, ...expenses]);

      // Group the new expenses by date to update daily summaries
      const datesToUpdate = Array.from(new Set(finalExpenses.map((e) => e.date)));
      for (const date of datesToUpdate) {
        const allDayExpenses = [...finalExpenses, ...expenses].filter((e) => e.date === date);
        await updateDailySummaryEvent(accessToken, calId, date, allDayExpenses);
      }
      
      setLastSynced(new Date());
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save approved transactions");
    } finally {
      setIsSyncing(false);
    }
  }, [
    isAuthenticated,
    accessToken,
    googleCalendarId,
    setGoogleCalendarId,
    expenses,
    addImportedGmailId,
    setExpenses,
  ]);

  // Create a single expense event
  const pushExpense = useCallback(async (expense: Expense) => {
    if (!isAuthenticated || !accessToken) return expense;
    try {
      const calId = googleCalendarId || (await getOrCreateFlowCalendar(accessToken));
      if (!googleCalendarId) {
        setGoogleCalendarId(calId);
      }

      const eventId = await createExpenseEvent(accessToken, calId, expense);
      const updatedExpense = { ...expense, googleCalendarEventId: eventId };

      // Update daily summary
      const allDayExpenses = [updatedExpense, ...expenses.filter((e) => e.id !== expense.id)];
      await updateDailySummaryEvent(accessToken, calId, expense.date, allDayExpenses);

      return updatedExpense;
    } catch (e) {
      console.error("Failed to push expense to calendar", e);
      return expense;
    }
  }, [isAuthenticated, accessToken, googleCalendarId, setGoogleCalendarId, expenses]);

  // Delete a single expense event
  const removeExpense = useCallback(async (expense: Expense) => {
    if (!isAuthenticated || !accessToken || !expense.googleCalendarEventId) return;
    try {
      const calId = googleCalendarId || (await getOrCreateFlowCalendar(accessToken));
      await deleteExpenseEvent(accessToken, calId, expense.googleCalendarEventId);

      // Re-calculate daily summary with this expense removed
      const remainingDayExpenses = expenses.filter(
        (e) => e.date === expense.date && e.id !== expense.id
      );
      await updateDailySummaryEvent(accessToken, calId, expense.date, remainingDayExpenses);
    } catch (e) {
      console.error("Failed to delete expense from calendar", e);
    }
  }, [isAuthenticated, accessToken, googleCalendarId, expenses]);

  return {
    isSyncing,
    error,
    lastSynced,
    syncFromCalendar,
    syncGmail,
    approveTransactions,
    pushExpense,
    removeExpense,
  };
}
