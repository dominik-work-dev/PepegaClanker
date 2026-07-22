const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

/**
 * Buduje embed z aktualnie graną piosenką i najbliższymi w kolejce.
 * @param {object} current - piosenka aktualnie odtwarzana (przekazana jawnie z playSong)
 * @param {import('./musicQueue')} queue
 */
function buildNowPlayingEmbed(current, queue) {
  // Bezpieczne zabezpieczenie - jeśli z jakiegoś powodu "current" nie dotarło,
  // nie wywalaj bota, tylko zwróć prosty embed z informacją.
  if (!current) {
    return new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🎵 Teraz odtwarzane")
      .setDescription("Brak informacji o aktualnym utworze.");
  }

  // upNext bazuje na queue.songs - to co zostało w kolejce po "current".
  // Jeśli Twój nextSong()/addSong() trzyma current TAKŻE w queue.songs[0],
  // odetnij go; w przeciwnym razie queue.songs to już same nadchodzące utwory.
  const upNext = queue.songs[0] === current
    ? queue.songs.slice(1, 6)
    : queue.songs.slice(0, 5);

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
 * @param {object} currentSong - piosenka aktualnie odtwarzana
 */
async function updateNowPlaying(queue) {
  const currentSong = queue.currentlyPlaying;
  const embed = buildNowPlayingEmbed(currentSong, queue);
  const buttons = buildControlButtons();

  if (queue.nowPlayingMessage) {
    try {
      await queue.nowPlayingMessage.edit({
        embeds: [embed],
        components: [buttons],
      });
      return;
    } catch (err) {
      console.warn("Nie udało się zedytować wiadomości Now Playing, wysyłam nową:", err.message);
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