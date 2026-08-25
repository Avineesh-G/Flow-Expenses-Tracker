import { useState, useCallback } from "react";
import { useStore } from "@/store/useStore";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import {
  fetchTransactionEmails,
  parseEmailToExpense,
} from "@/lib/googleApi";
import type { Expense } from "@/types";

export function useGoogleSync() {
  const { accessToken, isAuthenticated } = useGoogleAuth();
  const {
    expenses,
    importedGmailIds,
    setExpenses,
    addImportedGmailId,
  } = useStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

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
  }, [isAuthenticated, accessToken, importedGmailIds]);

  // Save approved transactions to local store only (no Calendar)
  const approveTransactions = useCallback(async (approvedExpenses: Expense[]) => {
    if (approvedExpenses.length === 0) return;
    setIsSyncing(true);
    try {
      for (const expense of approvedExpenses) {
        if (expense.gmailMessageId) {
          addImportedGmailId(expense.gmailMessageId);
        }
      }
      // Merge with existing, avoiding duplicates by id
      const existingIds = new Set(expenses.map((e) => e.id));
      const newOnes = approvedExpenses.filter((e) => !existingIds.has(e.id));
      setExpenses([...newOnes, ...expenses]);
      setLastSynced(new Date());
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save approved transactions");
    } finally {
      setIsSyncing(false);
    }
  }, [expenses, addImportedGmailId, setExpenses]);

  return {
    isSyncing,
    error,
    lastSynced,
    syncGmail,
    approveTransactions,
  };
}
