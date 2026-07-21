const { content } = require("googleapis/build/src/apis/content");
const MusicQueue = require("./musicQueue");
const { playSong } = require("./player");
const { joinVoiceChannel } = require("@discordjs/voice");
const { MessageFlags } = require("discord.js");

const queues = new Map();

module.exports = {
  name: "play",
  description: "Odtwarza muzykę z YouTube",

  async execute(interaction) {
    const url = interaction.options.getString("url");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel)
      return interaction.reply({
        content: "Musisz być na voice!",
        flags: MessageFlags.Ephemeral,
      });

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
