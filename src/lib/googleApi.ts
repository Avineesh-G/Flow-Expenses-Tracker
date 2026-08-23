import type { Expense } from "@/types";

// Helper to handle API responses
async function fetchJson<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API Error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// 1. Google Calendar List / Create "Flow Expenses" Calendar
export async function getOrCreateFlowCalendar(token: string): Promise<string> {
  // Try to find the calendar first
  const listUrl = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
  const listData = await fetchJson<{ items: any[] }>(listUrl, token);
  
  const existing = listData.items?.find(
    (item) => item.summary === "Flow Expenses" && !item.deleted
  );

  if (existing) {
    return existing.id;
  }

  // Create new calendar
  const createUrl = "https://www.googleapis.com/calendar/v3/calendars";
  const newCal = await fetchJson<{ id: string }>(createUrl, token, {
    method: "POST",
    body: JSON.stringify({ summary: "Flow Expenses" }),
  });

  return newCal.id;
}

// 2. Fetch all expenses from "Flow Expenses" Calendar
export async function fetchExpensesFromCalendar(token: string, calendarId: string): Promise<Expense[]> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events?maxResults=2500`;
  
  const data = await fetchJson<{ items: any[] }>(url, token);
  const expenses: Expense[] = [];

  if (!data.items) return [];

  for (const event of data.items) {
    const privateProps = event.extendedProperties?.private;
    if (privateProps && privateProps.flow_id) {
      expenses.push({
        id: privateProps.flow_id,
        amount: parseFloat(privateProps.flow_amount || "0"),
        description: privateProps.flow_description || event.summary || "",
        category: privateProps.flow_category || "misc",
        date: event.start?.date || new Date().toISOString().slice(0, 10),
        createdAt: event.created || new Date().toISOString(),
        googleCalendarEventId: event.id,
        merchant: privateProps.flow_merchant,
        isRecurring: privateProps.flow_isRecurring === "true",
        gmailMessageId: privateProps.flow_gmailMsgId,
      });
    }
  }

  return expenses;
}

// Get icon by category for Calendar display
function getCategoryIcon(category: string): string {
  switch (category) {
    case "food": return "🍔";
    case "transport": return "🚗";
    case "shopping": return "🛍️";
    case "entertainment": return "🎬";
    case "bills": return "🔌";
    case "health": return "❤️";
    case "education": return "📚";
    default: return "💸";
  }
}

// 3. Create or update an expense as a Calendar event
export async function createExpenseEvent(
  token: string,
  calendarId: string,
  expense: Expense
): Promise<string> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  
  // Format end date to be the next day (all-day event rule)
  const startDate = expense.date;
  const startDateTime = new Date(startDate);
  startDateTime.setDate(startDateTime.getDate() + 1);
  const endDate = startDateTime.toISOString().slice(0, 10);

  const icon = getCategoryIcon(expense.category);
  const eventBody = {
    summary: `${icon} ${expense.description} · ₹${expense.amount}`,
    description: `Expense tracked via Flow App`,
    start: { date: startDate },
    end: { date: endDate },
    extendedProperties: {
      private: {
        flow_id: expense.id,
        flow_amount: expense.amount.toString(),
        flow_category: expense.category,
        flow_description: expense.description,
        flow_merchant: expense.merchant || "",
        flow_isRecurring: expense.isRecurring ? "true" : "false",
        flow_gmailMsgId: expense.gmailMessageId || "",
      },
    },
  };

  const result = await fetchJson<{ id: string }>(url, token, {
    method: "POST",
    body: JSON.stringify(eventBody),
  });

  return result.id;
}

// 4. Delete an expense event from Calendar
export async function deleteExpenseEvent(
  token: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events/${encodeURIComponent(eventId)}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, {
    method: "DELETE",
    headers,
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Failed to delete event: ${errorText}`);
  }
}

// 5. Upsert Daily Summary Event
export async function updateDailySummaryEvent(
  token: string,
  calendarId: string,
  date: string,
  dayExpenses: Expense[]
): Promise<void> {
  if (dayExpenses.length === 0) return;

  const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Compute breakdown text
  const byCategory: Record<string, number> = {};
  dayExpenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });
  const descriptionLines = Object.entries(byCategory)
    .map(([cat, amt]) => `${cat.toUpperCase()}: ₹${amt}`)
    .join("\n");

  const icon = "📊";
  const summaryTitle = `${icon} Flow Daily Summary · ₹${total}`;

  // Find existing summary event for this date
  const listUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events?timeMin=${date}T00:00:00Z&timeMax=${date}T23:59:59Z&maxResults=50`;
  const listData = await fetchJson<{ items: any[] }>(listUrl, token);
  
  const existingSummary = listData.items?.find((e) => e.summary?.includes("Flow Daily Summary"));

  const startDateTime = new Date(date);
  startDateTime.setDate(startDateTime.getDate() + 1);
  const endDate = startDateTime.toISOString().slice(0, 10);

  const eventBody = {
    summary: summaryTitle,
    description: `Daily financial summary:\n\n${descriptionLines}`,
    start: { date },
    end: { date: endDate },
  };

  if (existingSummary) {
    // Update existing
    const updateUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events/${encodeURIComponent(existingSummary.id)}`;
    await fetchJson(updateUrl, token, {
      method: "PUT",
      body: JSON.stringify(eventBody),
    });
  } else {
    // Create new
    const createUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`;
    await fetchJson(createUrl, token, {
      method: "POST",
      body: JSON.stringify(eventBody),
    });
  }
}

// 6. Gmail: Fetch messages matching transaction queries
export interface GmailMessageInfo {
  id: string;
  snippet: string;
  body: string;
  date: string;
}

export async function fetchTransactionEmails(token: string): Promise<GmailMessageInfo[]> {
  const validSenders = [
    "alerts@hdfcbank.bank.in",
    "service@service.icicisecurities.com",
    "alerts@axis.bank.in",
    "cc.statements@axis.bank.in",
    "support@hdfc.bank.in",
    "support@hdfcbank.com",
    "customerservices.cards@hdfcbank.com",
    "cbalerts.sbi@alerts.sbi.co.in",
    "cbsalerts.sbi@alerts.sbi.co.in",
    "neftinfo.itps@alerts.sbi.co.in",
    "Transaction.alert@axisbank.com",
    "no-reply@rmt.flipkart.com",
    "no-reply@nct.flipkart.com",
    "no-reply@flipkart.com"
  ];
  
  const sendersQuery = validSenders.map(s => `from:${s}`).join(" OR ");
  const contentQuery = `(debited OR credited OR paid OR payment OR transaction OR received OR refund OR "Rs." OR "INR" OR "₹")`;
  
  // Fetch messages matching trusted financial senders AND financial keywords from the last 1 month
  const q = encodeURIComponent(`(${sendersQuery}) ${contentQuery} newer_than:1m`);
  const url = `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=500&q=${q}`;
  const data = await fetchJson<{ messages?: { id: string }[] }>(url, token);

  if (!data.messages || data.messages.length === 0) return [];

  const results: GmailMessageInfo[] = [];

  for (const msgRef of data.messages) {
    try {
      const msgUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`;
      const msg = await fetchJson<any>(msgUrl, token);

      let body = "";
      // Extract email body text
      if (msg.payload?.parts) {
        // Multi-part message
        const textPart = msg.payload.parts.find((part: any) => part.mimeType === "text/plain");
        if (textPart?.body?.data) {
          body = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        }
      } else if (msg.payload?.body?.data) {
        // Single part message
        body = atob(msg.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      }

      // If body is still empty, fallback to snippet
      if (!body) {
        body = msg.snippet || "";
      }

      // Extract Date header
      const dateHeader = msg.payload?.headers?.find((h: any) => h.name === "Date")?.value;
      const date = dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString();

      results.push({
        id: msg.id,
        snippet: msg.snippet || "",
        body,
        date,
      });
    } catch (e) {
      console.error("Error fetching individual message details", e);
    }
  }

  return results;
}

// 7. Parse email body into structured expense fields
export function parseEmailToExpense(msg: GmailMessageInfo): Omit<Expense, "id" | "createdAt"> | null {
  const text = msg.body + " " + msg.snippet;

  // Determine type: debit or credit
  let type: "debit" | "credit" = "debit";
  if (/(credited|received|refund|added to)/i.test(text) && !/(debited|paid|spent)/i.test(text)) {
    type = "credit";
  }

  // Try to find amount:
  const amountRegexes = [
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i,
    /debited\s+(?:by|for)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)/i,
    /credited\s+(?:by|for)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{2})?)/i,
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)\s*(debited|credited)/i,
  ];

  let amountStr = "";
  for (const regex of amountRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      amountStr = match[1].replace(/,/g, "");
      break;
    }
  }

  if (!amountStr) return null;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) return null;

  // Try to find merchant:
  const merchantRegexes = [
    /paid\s+to\s+([A-Za-z0-9\s&]{3,20})/i,
    /payment\s+to\s+([A-Za-z0-9\s&]{3,20})/i,
    /debited\s+at\s+([A-Za-z0-9\s&]{3,20})/i,
    /transferred\s+to\s+([A-Za-z0-9\s&]{3,20})/i,
    /sent\s+to\s+([A-Za-z0-9\s&]{3,20})/i,
    /spent\s+at\s+([A-Za-z0-9\s&]{3,20})/i,
    /received\s+from\s+([A-Za-z0-9\s&]{3,20})/i,
    /at\s+([A-Za-z0-9\s&]{3,20})\s+Ref/i,
    /Merchant:\s+([A-Za-z0-9\s&]{3,20})/i,
  ];

  let merchant = "";
  for (const regex of merchantRegexes) {
    const match = text.match(regex);
    if (match && match[1]) {
      merchant = match[1].trim();
      break;
    }
  }

  // Clean merchant name or generic fallback
  if (!merchant || merchant.toLowerCase().includes("vpa") || merchant.toLowerCase().includes("ref")) {
    if (text.toLowerCase().includes("swiggy")) merchant = "Swiggy";
    else if (text.toLowerCase().includes("zomato")) merchant = "Zomato";
    else if (text.toLowerCase().includes("uber")) merchant = "Uber";
    else if (text.toLowerCase().includes("ola")) merchant = "Ola";
    else if (text.toLowerCase().includes("amazon")) merchant = "Amazon";
    else if (text.toLowerCase().includes("netflix")) merchant = "Netflix";
    else if (text.toLowerCase().includes("spotify")) merchant = "Spotify";
    else merchant = type === "credit" ? "Deposit" : "Transaction";
  }

  const description = merchant;

  // Map to category
  let category = type === "credit" ? "income" : "misc";
  if (type === "debit") {
    const textLower = text.toLowerCase();
    if (textLower.includes("swiggy") || textLower.includes("zomato") || textLower.includes("restaurant") || textLower.includes("cafe") || textLower.includes("food") || textLower.includes("grocery") || textLower.includes("mart")) {
      category = "food";
    } else if (textLower.includes("uber") || textLower.includes("ola") || textLower.includes("metro") || textLower.includes("petrol") || textLower.includes("diesel") || textLower.includes("bus") || textLower.includes("train") || textLower.includes("cab")) {
      category = "transport";
    } else if (textLower.includes("amazon") || textLower.includes("flipkart") || textLower.includes("myntra") || textLower.includes("mall") || textLower.includes("shopping") || textLower.includes("store")) {
      category = "shopping";
    } else if (textLower.includes("netflix") || textLower.includes("spotify") || textLower.includes("movie") || textLower.includes("theatre") || textLower.includes("game") || textLower.includes("hotstar") || textLower.includes("youtube")) {
      category = "entertainment";
    } else if (textLower.includes("electricity") || textLower.includes("water") || textLower.includes("internet") || textLower.includes("phone") || textLower.includes("recharge") || textLower.includes("bill") || textLower.includes("utility")) {
      category = "bills";
    } else if (textLower.includes("pharmacy") || textLower.includes("doctor") || textLower.includes("hospital") || textLower.includes("medical") || textLower.includes("clinic") || textLower.includes("medicine")) {
      category = "health";
    } else if (textLower.includes("course") || textLower.includes("book") || textLower.includes("tuition") || textLower.includes("class") || textLower.includes("school") || textLower.includes("college")) {
      category = "education";
    }
  }

  // Extract account ending
  let account = "";
  const accountMatch = text.match(/(?:account ending|a\/c|acct)[\s:-]*[x*.]*(\d{3,4})/i);
  if (accountMatch && accountMatch[1]) {
    account = "XXXX" + accountMatch[1];
  }

  // Extract reference number
  let reference = "";
  const refMatch = text.match(/(?:reference|ref no|txn id|transaction)[\s:-]*([a-zA-Z0-9]{6,15})/i);
  if (refMatch && refMatch[1]) {
    reference = refMatch[1].toUpperCase();
  }

  const date = msg.date.slice(0, 10);

  return {
    type,
    amount,
    description,
    category,
    date,
    merchant,
    account,
    reference,
    gmailMessageId: msg.id,
  };
}
