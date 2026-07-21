const { createAudioPlayer, createAudioResource } = require("@discordjs/voice");
const ytdl = require("@distube/ytdl-core");

async function playSong(queue, song) {
  console.log("playSong() dostał:", song);
  const stream = ytdl(song.url, {
    filter: "audioonly",
    highWaterMark: 1 << 25,
  });

  const resource = createAudioResource(stream);

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
