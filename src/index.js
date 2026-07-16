require("dotenv").config();
const triggers = require("./triggers.js");
const quotes = require("./wordsOfWisdom.js");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
} = require("discord.js");

const dsc_token = process.env.DISCORD_TOKEN;
const dsc_app_id = process.env.DISCORD_APP_ID;

const rest = new REST({ version: "10" }).setToken(dsc_token);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

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

  // /ping
  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }

  // /addquote
  if (interaction.commandName === "addquote") {
    const text = interaction.options.getString("text");

    if (!text || text.trim().length === 0) {
      return interaction.reply("Cytat nie może być pusty you clanker monki.");
    }

    const quote = quotes.addQuote(text);
    return interaction.reply(`Dodano cytat #${quote.id}: "${quote.text}`);
  }

  // /quote
  if (interaction.commandName === "quote") {
    const quote = quotes.randomQuote();

    if (!quote) return interaction.reply("Lista złotych myśli jest pusta");

    return interaction.reply(`#${quote.id}: ${quote.text}`);
  }

  // /delquote
  if (interaction.commandName === "delquote") {
    const id = interaction.options.getStrin("id");
    const removed = quotes.deleteQuote(id);

    if(!removed) return interaction.reply(`Złota myśl o ID #${id} nie istnieje you monki`);

    return interaction.reply(`Usnięto cytat #${id}: ${removed.text}`)
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

function pickWeighted(responses) {
  const totalWeight = responses.reduce(
    (sum, response) => sum + response.weight,
    0,
  );
  let randomValue = Math.random() * totalWeight;
  for (const response of responses) {
    randomValue -= response.weight;
    if (randomValue <= 0) return response;
  }

  return responses[0]; // fallback in case of rounding errors
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const text = message.content.toLowerCase().trim();

  for (const trigger of triggers) {
    if (!text.includes(trigger.match)) continue; // Check if the message contains the trigger match
    if (Math.random() > (trigger.chance ?? 0.5)) continue; // Check if the random chance allows for this trigger to activate

    let response = {
      text: trigger.text ?? "",
      customEmoji: trigger.customEmoji ?? "",
      react: trigger.react ?? "",
    };

    // 1) Weigthed random response
    if (trigger.weighted) {
      const picked = pickWeighted(trigger.responses);
      response = { ...response, ...picked };
    }

    // 2) Sending a message + optional custom emoji
    if (response.text || response.customEmoji) {
      let finalMessage = response.text;
      if (response.customEmoji) {
        const emoji = message.guild.emojis.cache.find(
          (e) => e.name === response.customEmoji,
        );
        const emojiStr = emoji ? emoji.toString() : response.customEmoji;

        finalMessage += response.text ? ` ${emojiStr}` : emojiStr;
      }

      await message.channel.send(finalMessage);
    }

    // 3) Reacting to the message with an emoji
    if (response.react) {
      const emoji = message.guild.emojis.cache.find(
        (e) => e.name === response.react,
      );
      try {
        await message.react(emoji ?? response.react);
      } catch (error) {
        console.error(`Nie udało się zareagować na wiadomość: ${error}`);
      }
    }

    break;
  }
});

client.login(dsc_token);
