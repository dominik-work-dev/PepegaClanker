const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

/**
 * Buduje embed z aktualnie graną piosenką i najbliższymi w kolejce.
 * @param {import('./musicQueue')} queue
 */
function buildNowPlayingEmbed(queue) {
  const current = queue.songs[0];
  const upNext = queue.songs.slice(1, 6); // pokaż max 5 kolejnych

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("🎵 Teraz odtwarzane")
    .setDescription(
      `**${current.title}**\nDodane przez: ${current.requestedBy}`
    )
    .setThumbnail(current.thumbnail ?? null);

  if (upNext.length > 0) {
    embed.addFields({
      name: "Następne w kolejce",
      value: upNext.map((s, i) => `${i + 1}. ${s.title}`).join("\n"),
    });
  }

  return embed;
}

/**
 * Buduje rząd przycisków sterujących odtwarzaniem.
 */
function buildControlButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("music_pause")
      .setEmoji("⏸️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger)
  );
}

/**
 * Wysyła nową wiadomość "Teraz odtwarzane" albo edytuje istniejącą,
 * jeśli już jedna istnieje dla tej kolejki.
 * @param {import('./musicQueue')} queue
 */
async function updateNowPlaying(queue) {
  const embed = buildNowPlayingEmbed(queue);
  const buttons = buildControlButtons();

  if (queue.nowPlayingMessage) {
    try {
      await queue.nowPlayingMessage.edit({
        embeds: [embed],
        components: [buttons],
      });
      return;
    } catch {
      // Wiadomość mogła zostać usunięta ręcznie na Discordzie - wyślij nową.
    }
  }

  queue.nowPlayingMessage = await queue.textChannel.send({
    embeds: [embed],
    components: [buttons],
  });
}

module.exports = {
  buildNowPlayingEmbed,
  buildControlButtons,
  updateNowPlaying,
};