const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const quotes = require("./google.js");

async function updateQuotesMessage(client, page = 1) {
  const state = await quotes.getState();
  if (!state.quotesChannelId || !state.quotesMessageId) return;

  const channel = await client.channels.fetch(state.quotesChannelId);
  const message = await channel.messages.fetch(state.quotesMessageId);

  const all = await quotes.getQuotes();
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(all.length / perPage));
  if (page > totalPages) page = totalPages;
  if (page < 1) page = 1;

  await quotes.setState("currentPage", page);

  const start = (page - 1) * perPage;
  const pageQuotes = all.slice(start, start + perPage);

  const colID = 4;
  const colQuote = 32;

  const pad = (str, len) =>
    str.length > len ? str.slice(0, len - 3) + "..." : str.padEnd(len, " ");

  let lines = [];
  lines.push(pad("#", 4) + pad("ID", colID) + pad("Złota myśl", colQuote));

  if (pageQuotes.length === 0) {
    lines.push("Brak złotych myśli");
  } else {
    for (let i = 0; i < pageQuotes.length; i++) {
      const q = pageQuotes[i];
      const row =
        pad(String(q.id), colID) +
        pad(q.text, colQuote);

      lines.push(row);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`📜 Lista cytatów - strona ${page}/${totalPages}`)
    .addFields(
    {
      name: "ID",
      value: pageQuotes.map(q => String(q.id)).join("\n"),
      inline: true,
    },
    {
      name: "Złota myśl",
      value: pageQuotes.map(q => q.text).join("\n"),
      inline: true,
    }
  )
    .setColor("Random");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`quotes_prev_${page}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),

    new ButtonBuilder()
      .setCustomId(`quotes_next_${page}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPages),
  );

  await message.edit({ content: "", embeds: [embed], components: [row] });
}

module.exports = {
  updateQuotesMessage,
};
