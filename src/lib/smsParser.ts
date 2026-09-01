// src/lib/smsParser.ts
// Parses Indian bank/UPI SMS messages to extract transaction details

export interface ParsedSMS {
  amount: number;
  merchant: string;
  type: "debit" | "credit";
  date: string;
  account?: string;
  upiRef?: string;
}

// All amounts in Indian currency — Rs, INR, ₹
const AMOUNT_PATTERN =
  /(?:Rs\.?|INR|₹)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i;

// Grab date from the SMS
const DATE_PATTERNS = [
  /(\d{2}[-/]\d{2}[-/]\d{2,4})/,
  /(\d{2}-(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2,4})/i,
  /(\d{4}-\d{2}-\d{2})/,
];

// Merchant/payee extraction
const MERCHANT_PATTERNS = [
  // "paid to <merchant>"
  /paid\s+(?:to\s+)?([A-Za-z0-9@._\- ]{3,40}?)(?:\s+(?:via|using|on|\.|\bUPI\b|Ref|Txn|refno))/i,
  // "to <merchant> via"
  /\bto\s+([A-Za-z0-9@._\- ]{3,40}?)\s+(?:via|using|on|\bUPI\b)/i,
  // "Merchant: <name>"
  /Merchant[:\s]+([A-Za-z0-9 ]{3,30})/i,
  // "at <merchant>"
  /\bat\s+([A-Za-z0-9 .]{3,30})/i,
  // UPI id like name@upi or name@paytm
  /@([a-zA-Z]+)\b/,
];

const DEBIT_KEYWORDS = /debited|paid|sent|deducted|spent|charged|transferred out/i;
const CREDIT_KEYWORDS = /credited|received|added|deposited|refund/i;

function extractAmount(sms: string): number | null {
  const match = sms.match(AMOUNT_PATTERN);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

function extractType(sms: string): "debit" | "credit" {
  if (CREDIT_KEYWORDS.test(sms)) return "credit";
  if (DEBIT_KEYWORDS.test(sms)) return "debit";
  return "debit"; // default to debit for expense tracking
}

function extractMerchant(sms: string): string {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = sms.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, " ");
    }
  }
  // Fallback: try to guess from common app names
  if (/swiggy/i.test(sms)) return "Swiggy";
  if (/zomato/i.test(sms)) return "Zomato";
  if (/amazon/i.test(sms)) return "Amazon";
  if (/flipkart/i.test(sms)) return "Flipkart";
  if (/uber/i.test(sms)) return "Uber";
  if (/ola/i.test(sms)) return "Ola";
  if (/netflix/i.test(sms)) return "Netflix";
  if (/hotstar/i.test(sms)) return "Hotstar";
  if (/phonepe/i.test(sms)) return "PhonePe";
  if (/paytm/i.test(sms)) return "Paytm";
  if (/gpay|google pay/i.test(sms)) return "Google Pay";
  if (/cred/i.test(sms)) return "CRED";
  return "UPI Payment";
}

function extractDate(sms: string): string {
  for (const pattern of DATE_PATTERNS) {
    const match = sms.match(pattern);
    if (match?.[1]) {
      const raw = match[1];
      // Try to parse into YYYY-MM-DD
      try {
        const d = new Date(raw.replace(/-/g, " "));
        if (!isNaN(d.getTime())) {
          return d.toISOString().slice(0, 10);
        }
      } catch {
        // ignore
      }
    }
  }
  // Default to today
  return new Date().toISOString().slice(0, 10);
}

function extractAccount(sms: string): string | undefined {
  const match = sms.match(/(?:a\/c|account|acct)[\s*Xx#]*([0-9Xx*]{4,})/i);
  return match?.[1]?.toUpperCase();
}

export function parseSMS(sms: string): ParsedSMS | null {
  if (!sms || sms.trim().length < 10) return null;

  const amount = extractAmount(sms);
  if (!amount) return null; // Can't parse without amount

  return {
    amount,
    merchant: extractMerchant(sms),
    type: extractType(sms),
    date: extractDate(sms),
    account: extractAccount(sms),
  };
}
