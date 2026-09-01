// src/hooks/useSmsSync.ts
// Fully automatic SMS bank transaction sync hook
// - On first launch: imports last 5 months of bank SMS
// - Ongoing: listens for new SMS in real-time
// - Runs silently, no manual sync needed

import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import SmsReaderPlugin, { type SmsMessage } from '@/plugins/SmsReaderPlugin';
import { parseSMS } from '@/lib/smsParser';
import { suggestCategory } from '@/utils/categories';
import { useStore } from '@/store/useStore';
import { useGoogleAuth } from '@/context/GoogleAuthContext';

const STORAGE_KEY = 'flow_sms_imported_until';
const FIVE_MONTHS_MS = 5 * 30 * 24 * 60 * 60 * 1000;

export type SmsPermissionStatus = 'unknown' | 'granted' | 'denied' | 'unavailable';

/**
 * Returns true if we are running inside a Capacitor Android app.
 * Returns false on web/browser (Vercel) — hook does nothing there.
 */
function isNativeAndroid(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function useSmsSync() {
  const { addExpense, expenses } = useStore();
  const { isAuthenticated } = useGoogleAuth();
  const callbackIdRef = useRef<string | null>(null);
  const isRunningRef = useRef(false);

  /** Deduplicate: check if an expense with same date+amount+merchant already exists */
  const isDuplicate = useCallback(
    (date: string, amount: number, merchant: string): boolean => {
      return expenses.some(
        (e) =>
          e.date === date &&
          e.amount === amount &&
          (e.description.toLowerCase() === merchant.toLowerCase() ||
            (e.merchant ?? '').toLowerCase() === merchant.toLowerCase())
      );
    },
    [expenses]
  );

  /** Process a single SMS message — parse it and add to store if it's a new bank transaction */
  const processSms = useCallback(
    (msg: SmsMessage) => {
      const parsed = parseSMS(msg.body);
      if (!parsed || parsed.type !== 'debit') return; // only track spending

      const date = new Date(msg.date).toISOString().slice(0, 10);

      if (isDuplicate(date, parsed.amount, parsed.merchant)) return;

      // suggestCategory based on merchant name
      const category = suggestCategory(parsed.merchant) ?? 'Other';

      addExpense({
        date,
        amount: parsed.amount,
        description: parsed.merchant,
        category,
        merchant: parsed.merchant,
        account: parsed.account,
        // Raw SMS body is NEVER stored — privacy preserved
      });
    },
    [addExpense, isDuplicate]
  );

  /** Import historical SMS from the last 5 months (runs once per install) */
  const importHistoricalSms = useCallback(async () => {
    const alreadyImportedUntil = localStorage.getItem(STORAGE_KEY);
    const fiveMonthsAgo = Date.now() - FIVE_MONTHS_MS;

    // If we've already imported up to this point, skip
    if (alreadyImportedUntil && parseInt(alreadyImportedUntil) >= fiveMonthsAgo - 1000 * 60 * 60) {
      return;
    }

    try {
      const { messages } = await SmsReaderPlugin.readBankSms({ days: 150 }); // ~5 months
      // Sort oldest-first so Firestore ordering is correct
      const sorted = [...messages].sort((a, b) => a.date - b.date);
      for (const msg of sorted) {
        processSms(msg);
      }
      // Mark import done
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (err) {
      console.error('[useSmsSync] Historical import error:', err);
    }
  }, [processSms]);

  /** Start real-time listener for new incoming SMS */
  const startRealtimeListener = useCallback(async () => {
    if (callbackIdRef.current) return; // already listening

    try {
      const { callbackId } = await SmsReaderPlugin.startListening((msg: SmsMessage) => {
        processSms(msg);
      });
      callbackIdRef.current = callbackId;
    } catch (err) {
      console.error('[useSmsSync] Could not start SMS listener:', err);
    }
  }, [processSms]);

  /** Main entry: request permission if needed, then run import + listener */
  const initSync = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    try {
      // Check if already granted
      const { granted: alreadyGranted } = await SmsReaderPlugin.checkPermission();
      if (!alreadyGranted) {
        // Permission not granted yet — the SmsPermissionPrompt will handle asking
        isRunningRef.current = false;
        return;
      }

      // Permission is granted — run historical import then start live listener
      await importHistoricalSms();
      await startRealtimeListener();
    } catch (err) {
      console.error('[useSmsSync] Init error:', err);
    } finally {
      isRunningRef.current = false;
    }
  }, [importHistoricalSms, startRealtimeListener]);

  // Auto-start when user logs in (and we're on Android)
  useEffect(() => {
    if (!isAuthenticated || !isNativeAndroid()) return;
    initSync();

    return () => {
      // Cleanup listener on unmount
      if (callbackIdRef.current) {
        SmsReaderPlugin.stopListening({ callbackId: callbackIdRef.current });
        callbackIdRef.current = null;
      }
    };
  }, [isAuthenticated, initSync]);

  return { initSync };
}

export { isNativeAndroid };
