// src/hooks/useFirestoreSync.ts
// Syncs the local zustand store with Firestore in real-time.
// On login: loads user's data from Firestore into local store.
// On every change: writes the updated data back to Firestore.

import { useEffect, useRef } from "react";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useStore } from "@/store/useStore";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import type { Expense } from "@/types";

export function useFirestoreSync() {
  const { user } = useGoogleAuth();
  const store = useStore();
  const initialLoadDone = useRef(false);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      // Clear listener on sign-out
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      initialLoadDone.current = false;
      return;
    }

    const uid = user.uid;

    async function loadUserData() {
      // 1. Load settings
      const settingsDoc = await getDoc(doc(db, "users", uid, "data", "settings"));
      if (settingsDoc.exists()) {
        store.updateSettings(settingsDoc.data() as object);
      }

      // 2. Load expenses from sub-collection
      const expensesSnap = await getDocs(collection(db, "users", uid, "expenses"));
      const expenses: Expense[] = [];
      expensesSnap.forEach((d) => expenses.push(d.data() as Expense));
      if (expenses.length > 0) {
        store.setExpenses(expenses.sort((a, b) => b.date.localeCompare(a.date)));
      }

      // 3. Load budgets
      const budgetsSnap = await getDoc(doc(db, "users", uid, "data", "budgets"));
      if (budgetsSnap.exists()) {
        const budgets = budgetsSnap.data().list || [];
        if (budgets.length > 0) {
          store.setBudgets(budgets);
        }
      }

      initialLoadDone.current = true;

      // 4. Listen for real-time expense changes (e.g. user opens on another device)
      unsubscribeRef.current = onSnapshot(
        collection(db, "users", uid, "expenses"),
        (snap) => {
          if (!initialLoadDone.current) return;
          const remoteExpenses: Expense[] = [];
          snap.forEach((d) => remoteExpenses.push(d.data() as Expense));
          store.setExpenses(remoteExpenses.sort((a, b) => b.date.localeCompare(a.date)));
        }
      );
    }

    loadUserData().catch(console.error);

    return () => {
      unsubscribeRef.current?.();
    };
  }, [user?.uid]);

  // --- Write helpers called by the store ---
  // These are exposed so the store actions can call them after local updates.
  return {
    syncExpenseAdd: async (expense: Expense) => {
      if (!user?.uid) return;
      await setDoc(doc(db, "users", user.uid, "expenses", expense.id), expense);
    },
    syncExpenseUpdate: async (expense: Expense) => {
      if (!user?.uid) return;
      await setDoc(doc(db, "users", user.uid, "expenses", expense.id), expense, { merge: true });
    },
    syncExpenseDelete: async (id: string) => {
      if (!user?.uid) return;
      await deleteDoc(doc(db, "users", user.uid, "expenses", id));
    },
    syncSettings: async (settings: object) => {
      if (!user?.uid) return;
      await setDoc(doc(db, "users", user.uid, "data", "settings"), settings, { merge: true });
    },
    syncBudgets: async (budgets: object[]) => {
      if (!user?.uid) return;
      await setDoc(doc(db, "users", user.uid, "data", "budgets"), { list: budgets }, { merge: true });
    },
  };
}
