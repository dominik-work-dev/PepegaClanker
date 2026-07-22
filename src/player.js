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
    return;
  }
  const stream = createYtDlpStream(song.url);

  const resource = createAudioResource(stream, {
    inputType: StreamType.Raw, // ffmpeg zwraca surowe PCM (s16le)
  });

  const player = createAudioPlayer();
  queue.player = player;

  player.play(resource);
  queue.connection.subscribe(player);

  // Aktualizuj / wyślij wiadomość "Teraz odtwarzane"
  await updateNowPlaying(queue, song);

  player.on("idle", () => {
    playSong(queue);
  });

  player.on("error", (err) => {
    console.error("Player error:", err.message);
    playSong(queue, next);
  });
}

module.exports = { playSong };
