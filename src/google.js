const { google } = require("googleapis");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

module.exports = {
  // ---------------------------
  // QUOTES
  // ---------------------------
  async getQuotes() {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Quotes!A:B",
    });

    const rows = res.data.values || [];
    return rows.slice(1).map(([id, text]) => ({
      id: Number(id),
      text,
    }));
  },

  async addQuote(text) {
    const quotes = await this.getQuotes();
    const id = quotes.length ? quotes[quotes.length - 1].id + 1 : 1;

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Quotes!A:B",
      valueInputOption: "RAW",
      requestBody: {
        values: [[id, text]],
      },
    });

    return { id, text };
  },

  async deleteQuote(id) {
    const quotes = await this.getQuotes();
    const quote = quotes.find((q) => q.id === id);

    if (!quote) return null; // cytat nie istnieje

    const filtered = quotes.filter((q) => q.id !== id);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "Quotes!A:B",
      valueInputOption: "RAW",
      requestBody: {
        values: [["id", "text"], ...filtered.map((q) => [q.id, q.text])],
      },
    });

    return quote; // zwracamy usunięty cytat
  },

  async getRandomQuote() {
    const quotes = await this.getQuotes();
    if (quotes.length === 0) return null;

    const index = Math.floor(Math.random() * quotes.length);
    return quotes[index];
  },

  // ---------------------------
  // STATE
  // ---------------------------
  async getState() {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "State!A:B",
    });

    const rows = res.data.values || [];
    const state = {};

    for (const [key, value] of rows.slice(1)) {
      state[key] = value;
    }

    return state;
  },

  async setState(key, value) {
    const state = await this.getState();
    state[key] = value;

    const rows = Object.entries(state);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "State!A:B",
      valueInputOption: "RAW",
      requestBody: {
        values: [["key", "value"], ...rows],
      },
    });
  },
};
