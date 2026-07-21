class MusicQueue {
  constructor(guildId) {
    this.guildId = guildId;
    this.songs = [];
    this.connection = null;
    this.player = null;
    this.textChannel = null;
    this.voiceChannel = null;
    this.isPlaying = false;
  }

  addSong(song) {
    this.songs.push(song);
  }

  nextSong() {
    return this.songs.shift();
  }
}

module.exports = MusicQueue;
