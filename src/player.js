const {
  createAudioPlayer,
  createAudioResource,
  StreamType,
} = require("@discordjs/voice");
const { createYtDlpStream } = require("./ytdlpStream");
const { updateNowPlaying } = require("./musicQueueDisplay");

async function playSong(queue) {
  const song = queue.nextSong();

  if (!song) {
    if (queue.connection.state.status !== "destroyed") {
      queue.connection.destroy();
    }
    queue.isPlaying = false;
    queue.currentlyPlaying = null;
    // Usuń wiadomość "Teraz odtwarzane", skoro kolejka się skończyła
    if (queue.nowPlayingMessage) {
      try {
        await queue.nowPlayingMessage.delete();
      } catch (err) {
        console.warn(
          "Nie udało się usunąć wiadomości Now Playing:",
          err.message,
        );
      }
      queue.nowPlayingMessage = null;
    }
    return;
  }
  
  queue.currentlyPlaying = song;
  const stream = createYtDlpStream(song.url);

  const resource = createAudioResource(stream, {
    inputType: StreamType.Raw, // ffmpeg zwraca surowe PCM (s16le)
  });

  const player = createAudioPlayer();
  queue.player = player;

  player.play(resource);
  queue.connection.subscribe(player);

  // Aktualizuj / wyślij wiadomość "Teraz odtwarzane"
  await updateNowPlaying(queue);

  player.on("idle", () => {
    playSong(queue);
  });

  player.on("error", (err) => {
    console.error("Player error:", err.message);
    playSong(queue);
  });
}

module.exports = { playSong };
