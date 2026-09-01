// src/plugins/SmsReaderPlugin.ts
// Capacitor bridge to native Android SMS reading
import { registerPlugin } from '@capacitor/core';

export interface SmsMessage {
  address: string;  // sender (e.g., "HDFCBK", "VM-ICICIB")
  body: string;     // raw SMS text
  date: number;     // timestamp in ms
}

export interface SmsReaderPlugin {
  /**
   * Request READ_SMS and RECEIVE_SMS permissions from the user.
   * Returns { granted: true } if permission was granted.
   */
  requestPermission(): Promise<{ granted: boolean }>;

  /**
   * Check if permission is already granted.
   */
  checkPermission(): Promise<{ granted: boolean }>;

  /**
   * Read all SMS from the last `days` days.
   * Only returns messages matching the bank sender filter.
   */
  readBankSms(options: { days: number }): Promise<{ messages: SmsMessage[] }>;

  /**
   * Start listening for new incoming SMS in the background.
   * The callback fires every time a new SMS arrives.
   * Call this once after permission is granted.
   */
  startListening(callback: (message: SmsMessage) => void): Promise<{ callbackId: string }>;

  /**
   * Stop the background SMS listener.
   */
  stopListening(options: { callbackId: string }): Promise<void>;
}

// Register the plugin — this connects to the native Java implementation
const SmsReaderPlugin = registerPlugin<SmsReaderPlugin>('SmsReaderPlugin', {
  // Web fallback (does nothing on browser — SMS is Android-only)
  web: {
    requestPermission: async () => ({ granted: false }),
    checkPermission: async () => ({ granted: false }),
    readBankSms: async () => ({ messages: [] }),
    startListening: async () => ({ callbackId: '' }),
    stopListening: async () => {},
  },
});

export default SmsReaderPlugin;
