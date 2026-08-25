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

// Gmail: Fetch ALL messages matching transaction queries (paginated)
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

  const sendersQuery = `{${validSenders.map(s => `from:${s}`).join(" ")}}`;
  const contentQuery = `{debited credited paid payment transaction received refund "Rs." "INR"}`;

  // Fetch ALL matching emails — paginated, no time limit
  const q = encodeURIComponent(`${sendersQuery} ${contentQuery}`);
  
  const allMessageRefs: { id: string }[] = [];
  let pageToken: string | undefined = undefined;

  // Paginate through ALL results
  do {
    const pageParam: string = pageToken ? `&pageToken=${pageToken}` : "";
    const url: string = `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=500&q=${q}${pageParam}`;
    const data: { messages?: { id: string }[]; nextPageToken?: string } = await fetchJson<{
      messages?: { id: string }[];
      nextPageToken?: string;
    }>(url, token);

    if (data.messages) {
      allMessageRefs.push(...data.messages);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  if (allMessageRefs.length === 0) return [];

  const results: GmailMessageInfo[] = [];

  for (const msgRef of allMessageRefs) {
    try {
      const msgUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}`;
      const msg = await fetchJson<any>(msgUrl, token);

      let body = "";
      // Extract email body text
      if (msg.payload?.parts) {
        const textPart = msg.payload.parts.find((part: any) => part.mimeType === "text/plain");
        if (textPart?.body?.data) {
          body = atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
        }
      } else if (msg.payload?.body?.data) {
        body = atob(msg.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      }

      // Fallback to snippet
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

// Parse email body into structured expense fields
export function parseEmailToExpense(msg: GmailMessageInfo): Omit<Expense, "id" | "createdAt"> | null {
  const text = msg.body + " " + msg.snippet;

  // Determine type: debit or credit
  let type: "debit" | "credit" = "debit";
  if (/(credited|received|refund|added to)/i.test(text) && !/(debited|paid|spent)/i.test(text)) {
    type = "credit";
  }

  // Try to find amount
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

  // Try to find merchant
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
