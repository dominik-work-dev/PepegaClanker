const fs = require("fs");
const path = require("path");

const QUOTES_PATH = path.join(__dirname, "wordOfWisdom.json");

// Load quotes
function loadQuotes() {
  try {
    const data = fs.readFileSync(QUOTES_PATH, "utf8");
    return JSON.parse(data).quotes ?? [];
  } catch {
    return [];
  }
}

// Save quotes
function saveQuotes(quotes) {
  const data = JSON.stringify({ quotes }, null, 2);
  fs.writeFileSync(QUOTES_PATH, data, "utf8");
}

// Generate next quote ID
function generateId() {
  if (quotes.length === 0) return 1;
  return Math.max(...quotes.map((q) => q.id)) + 1;
}

// Add quote
function addQuote(text) {
  const quotes = loadQuotes();
  const id = generateId(quotes);

  const quote = { id, text: text.trim() };
  quotes.push(quote);
  saveQuotes(quotes);

  return quote;
}

// Random quote picker
function randomQuote() {
  const quotes = loadQuotes();
  if (quotes.length === 0) return null;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Delete quote
function deleteQuote(id) {
  const quotes = loadQuotes();
  const index = quotes.findIndex((q) => q.id === id);

  if (index === -1) return null;

  const removed = quotes[index];
  quotes.splice(index, 1);

  saveQuotes(quotes);

  return removed;
}

module.exports = {
  loadQuotes,
  addQuote,
  randomQuote,
  deleteQuote,
};
