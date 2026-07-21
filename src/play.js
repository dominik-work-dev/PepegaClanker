const MusicQueue = require("./musicQueue");
const { playSong } = require("./player");
const { joinVoiceChannel } = require("@discordjs/voice");

const queues = new Map();

module.exports = {
  name: "play",
  description: "Odtwarza muzykę z YouTube",

  async execute(interaction) {
    const url = interaction.options.getString("url");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) return interaction.reply("Musisz być na voice!");

    let queue = queues.get(interaction.guild.id);
    if (!queue) {
      queue = new MusicQueue(interaction.guild.id);
      queue.voiceChannel = voiceChannel;
      queue.textChannel = interaction.channel;

      queue.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      });

      queues.set(interaction.guild.id, queue);
    }

    const song = {
      title: url,
      url: url,
      requestedBy: interaction.user.username,
    };

    queue.addSong(song);

    interaction.reply(`Dodano do kolejki: ${url}`);

    if (!queue.isPlaying) {
      queue.isPlaying = true;
      playSong(queue, song);
    }
  },
};
