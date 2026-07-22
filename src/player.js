const {
  createAudioPlayer,
  createAudioResource,
  StreamType,
} = require("@discordjs/voice");
const { createYtDlpStream } = require("./ytdlpStream");
const { updateNowPlaying } = require("./musicQueueDisplay");

async function playSong(queue, song) {
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
    const next = queue.nextSong();
    if (!next) {
      if (queue.connection.state.status !== "destroyed") {
        queue.connection.destroy();
      }
      queue.isPlaying = false;
      return;
    }
    playSong(queue, next);
  });

  player.on("error", (err) => {
    console.error("Player error:", err.message);
    const next = queue.nextSong();
    if (!next) {
      if (queue.connection.state.status !== "destroyed") {
        queue.connection.destroy();
      }
      queue.isPlaying = false;
      return;
    }
    playSong(queue, next);
  });
}

module.exports = { playSong };
