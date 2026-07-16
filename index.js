require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { REST, Routes } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const dsc_token = process.env.DISCORD_TOKEN;
const dsc_app_id = process.env.DISCORD_APP_ID;

const rest = new REST({ version: "10" }).setToken(dsc_token);

async function registerCommands() {
  try {
    await rest.put(Routes.applicationCommands(dsc_app_id), {
      body: [
        {
          name: "ping",
          description: "Sprawdzenie czy bot działa.",
        },
      ],
    });
    console.log("Komendy zostały zarejestrowane.");
  } catch (error) {
    console.error("Błąd podczas rejestracji komend:", error);
  }
}

registerCommands();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
});

client.on("clientReady", () => {
  console.log(`Bot zalogowany jako ${client.user.tag}`);
});

client.on("guildMemberRemove", (member) => {
  const channel = member.guild.channels.cache.find((ch) => ch.name === "logi");

  if (channel) {
    const name =
      member.displayName !== member.user.username
        ? `${member.user.username} (${member.displayName})`
        : member.user.username;
    channel.send(`Użytkownik **${name}** opuścił serwer.`);
  }
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  const text = message.content.toLowerCase().trim();

  const triggers = {
    "pepega": "pepega",
    "clanker": ":robot:",
    "doomfist": ":boxing_glove:",
    "crindzfist": ":boxing_glove:",
    "cringe": "https://klipy.com/gifs/cringe-diesfromcringe-1",
  };

  for (const [key, reply] of Object.entries(triggers)) {
    if (text.includes(key)) {
      message.channel.send(reply);
      break;
    }
  }
});

client.login(dsc_token);
