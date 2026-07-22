require("dotenv").config();
const triggers = require("./triggers.js");
const quotes = require("./google.js");
const {
  updateQuotesMessage,
  loadState,
  saveState,
} = require("./quotesDisplay.js");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  MessageFlags,
  Routes,
} = require("discord.js");
const playMusic = require("./play.js");
const queues = require("./musicQueue")

const dsc_token = process.env.DISCORD_TOKEN;
const dsc_app_id = process.env.DISCORD_APP_ID;
const dsc_server_id = process.env.DISCORD_SERVER_ID;

const rest = new REST({ version: "10" }).setToken(dsc_token);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const { prepareCookiesFile } = require("./ytdlpStream");

prepareCookiesFile();

async function registerCommands() {
  try {
    await rest.put(Routes.applicationGuildCommands(dsc_app_id, dsc_server_id), {
      body: [
        {
          name: "ping",
          description: "Sprawdzenie czy bot działa",
        },
        {
          name: "play",
          description: "Odtwarza muzykę z YouTube",
          options: [
            {
              type: 3, // STRING
              name: "url",
              description: "Link do utworu na YouTube",
              required: true,
            },
          ],
        },
        {
          name: "quote",
          description: "Losuje jedną złotą myśl",
        },
        {
          name: "addquote",
          description: "Dodaje nową złotą myśl",
          options: [
            {
              type: 3, //STRING
              name: "text",
              description: "Treść złotej myśli do zapisania, you clanker",
              required: true,
            },
          ],
        },
        {
          name: "deletequote",
          description: "Usuwa złotą myśl o danym ID",
          options: [
            {
              type: 4, // INTEGER
              name: "id",
              description: "ID cytatu do usunięcia",
              required: true,
            },
          ],
        },
        {
          name: "listquotes",
          description: "Listuje wszystkie złote myśli",
        },
        /*{
          name: "createpersistentquotestable",
          description: "Tworzy TRWAŁĄ tablice ze złotymi myślami",
        },*/
      ],
    });
    console.log("Komendy zostały zarejestrowane.");
  } catch (error) {
    console.error("Błąd podczas rejestracji komend:", error);
  }
}

registerCommands();

client.on("interactionCreate", async (interaction) => {
  // -------------------------
  // 1) OBSŁUGA PRZYCISKÓW
  // -------------------------
  if (interaction.isButton()) {
    // PAGINACJA
    if (
      interaction.customId.startsWith("quotes_prev_") ||
      interaction.customId.startsWith("quotes_next_")
    ) {
      const [prefix, direction, currentPage] = interaction.customId.split("_");
      let page = parseInt(currentPage);

      if (direction === "prev") page--;
      if (direction === "next") page++;

      await updateQuotesMessage(client, page);
      return interaction.deferUpdate();
    }

    // POTWIERDZENIE UTWORZENIA PERSISTENT MESSAGE
    if (interaction.customId === "quotes_confirm") {
      await interaction.deferUpdate();

      const state = await quotes.getState();

      if (!state.quotesMessageId) {
        const msg = await interaction.channel.send(
          "Ładowanie złotych myśli...",
        );
        state.quotesMessageId = msg.id;
        state.quotesChannelId = msg.channel.id;
        await quotes.setState("quotesMessageId", msg.id);
        await quotes.setState("quotesChannelId", msg.channel.id);
      }

      await updateQuotesMessage(client, 1);
      return;
    }

    const queue = queues.get(interaction.guildId);
    if (!queue) {
      return interaction.reply({
        content: "Nic teraz nie gra.",
        ephemeral: true,
      });
    }
    if (interaction.customId === "music_pause") {
      if (queue.player.state.status === "playing") {
        queue.player.pause();
      } else {
        queue.player.unpause();
      }
      await interaction.deferUpdate();
    }
    if (interaction.customId === "music_skip") {
      queue.player.stop(); // wywoła zdarzenie "idle" -> zagra kolejną piosenkę
      await interaction.deferUpdate();
    }
    if (interaction.customId === "music_stop") {
      queue.songs = [];
      queue.isPlaying = false;
      if (queue.connection.state.status !== "destroyed") {
        queue.connection.destroy();
      }
      await interaction.deferUpdate();
    }

    return; // inne przyciski ignorujemy
  }

  // -------------------------
  // 2) OBSŁUGA KOMEND
  // -------------------------
  if (interaction.isChatInputCommand()) {
    // /ping
    if (interaction.commandName === "ping") {
      await interaction.reply("Pong!");
    }

    if (interaction.commandName === "play") {
      return playMusic.execute(interaction);
    }

    // /addQuote
    if (interaction.commandName === "addquote") {
      const text = interaction.options.getString("text");

      if (!text || text.trim().length === 0) {
        return interaction.reply({
          content: "Cytat nie może być pusty you clanker monki",
          flags: MessageFlags.Ephemeral,
        });
      }

      const quote = await quotes.addQuote(text);
      const state = await quotes.getState();
      const currentPage = Number(state.currentPage) || 1;
      await updateQuotesMessage(client, currentPage);

      return interaction.reply({
        content: `Dodano cytat #${quote.id}: "${quote.text}"`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // /quote
    if (interaction.commandName === "quote") {
      const quote = await quotes.getRandomQuote();

      if (!quote)
        return interaction.reply({
          content: "Lista złotych myśli jest pusta you monki",
          flags: MessageFlags.Ephemeral,
        });

      return interaction.reply({
        content: `#${quote.id}: ${quote.text}`,
      });
    }

    // /deleteQuote
    if (interaction.commandName === "deletequote") {
      const id = interaction.options.getInteger("id");
      const removed = await quotes.deleteQuote(id);

      if (!removed)
        return interaction.reply({
          content: `Złota myśl o ID #${id} nie istnieje you monki`,
          flags: MessageFlags.Ephemeral,
        });

      const state = await quotes.getState();
      const currentPage = Number(state.currentPage) || 1;
      await updateQuotesMessage(client, currentPage);

      return interaction.reply({
        content: `Usnięto cytat #${id}: ${removed.text}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // /listQuotes
    if (interaction.commandName === "listquotes") {
      const all = await quotes.getQuotes();
      if (all.length === 0) {
        return interaction.reply({
          content: "Brak złotych myśli you clanker",
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Lista cytatów")
        .setDescription(all.map((q) => `**#${q.id}** - ${q.text}`).join("\n"))
        .setColor("Random");

      return interaction.reply({ embeds: [embed] });
    }

    // /createPersistentQuotesTable
    if (interaction.commandName === "createpersistentquotestable") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("quotes_confirm")
          .setLabel("Potwierdź")
          .setStyle(ButtonStyle.Danger),
      );

      return interaction.reply({
        content:
          "⚠ Ta komenda utworzy persistent message z listą złotych myśli. Kontynuować?",
        components: [row],
        flags: MessageFlags.Ephemeral,
      });
    }
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
