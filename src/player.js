const { createAudioPlayer, createAudioResource } = require("@discordjs/voice");

const playdl = require("play-dl");

async function playSong(queue, song) {
  console.log("playSong() dostał:", song);
  // pobierz strumień audio z YouTube
  const stream = await playdl.stream(song.url);

  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });

  const player = createAudioPlayer();
  queue.player = player;

  player.play(resource);
  queue.connection.subscribe(player);

  player.on("idle", () => {
    const next = queue.nextSong();
    if (!next) {
      queue.connection.destroy();
      queue.isPlaying = false;
      return;
    }
    playSong(queue, next);
  });

  player.on("error", (err) => {
    console.error("Player error:", err);
    const next = queue.nextSong();
    if (!next) {
      queue.connection.destroy();
      queue.isPlaying = false;
      return;
    }
    playSong(queue, next);
  });
}

module.exports = { playSong };
