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

  const embed = new EmbedBuilder()
    .setTitle(`Lista cytatów - strona ${page}/${totalPages}`)
    .setDescription(
      pageQuotes.length === 0
        ? "Brak cytatów"
        : pageQuotes.map((q) => `**#${q.id}** - ${q.text}`).join("\n"),
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
