require("dotenv").config();
const triggers = require("./triggers.js");
const quotes = require("./quotes.js");
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

const dsc_token = process.env.DISCORD_TOKEN;
const dsc_app_id = process.env.DISCORD_APP_ID;
const dsc_server_id = process.env.DISCORD_SERVER_ID;

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
    await rest.put( Routes.applicationGuildCommands(dsc_app_id, dsc_server_id), {
      body: [
        {
          name: "ping",
          description: "Sprawdzenie czy bot działa",
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
        {
          name: "createpersistentquotestable",
          description: "Tworzy TRWAŁĄ tablice ze złotymi myślami",
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

      const state = loadState();
      console.log(state)

      if (!state.quotesMessageId) {
        const msg = await interaction.channel.send("Ładowanie złotych myśli...");
        state.quotesMessageId = msg.id;
        state.quotesChannelId = msg.channel.id;
        saveState(state);
      }

      await updateQuotesMessage(client, 1);
      return;
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

    // /addQuote
    if (interaction.commandName === "addquote") {
      const text = interaction.options.getString("text");

      if (!text || text.trim().length === 0) {
        return interaction.reply({
          content: "Cytat nie może być pusty you clanker monki",
          flags: MessageFlags.Ephemeral
        });
      }

      const quote = quotes.addQuote(text);
      await updateQuotesMessage(client); // odświeża stronę, na której był użytkown
      return interaction.reply({
        content: `Dodano cytat #${quote.id}: "${quote.text}"`,
        flags: MessageFlags.Ephemeral
      });
    }

    // /quote
    if (interaction.commandName === "quote") {
      const quote = quotes.randomQuote();

      if (!quote)
        return interaction.reply({
          content: "Lista złotych myśli jest pusta you monki",
          flags: MessageFlags.Ephemeral
        });

      return interaction.reply({
        content: `#${quote.id}: ${quote.text}`,
      });
    }

    // /deleteQuote
    if (interaction.commandName === "deletequote") {
      const id = interaction.options.getInteger("id");
      const removed = quotes.deleteQuote(id);

      if (!removed)
        return interaction.reply({
          content: `Złota myśl o ID #${id} nie istnieje you monki`,
          flags: MessageFlags.Ephemeral
        });

      await updateQuotesMessage(client); // odświeża stronę, na której był użytkown
      return interaction.reply({
        content: `Usnięto cytat #${id}: ${removed.text}`,
        flags: MessageFlags.Ephemeral
      });
    }

    // /listQuotes
    if (interaction.commandName === "listquotes") {
      const all = quotes.getAllQuotes();
      if (all.length === 0) {
        return interaction.reply({
          content: "Brak złotych myśli you clanker",
          flags: MessageFlags.Ephemeral
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Lista cytatów")
        .setDescription(all.map((q) => `**#${q.id}** - ${q.quote}`).join("\n"))
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
        flags: MessageFlags.Ephemeral
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
