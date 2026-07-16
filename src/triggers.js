/* Types :
- "message": Sends a simple message
- "message_with_emoji": Sends a message with an emoji
- "react": Reacts to the message with an emoji
- "weighted_random": Sends a random message from a list of responses with weights


{
  match: "",
  text: "",
  customEmoji: "", //optional, will be added to text
  react: "", //optional
  chance: 1, //optional, default is 1 (100%)
},


If using react and default emoji - dont use :emoji: - use unicode or emoji itself

*/

module.exports = [
  {
    match: "??",
    text: ":question:",
  },
  {
    match: "liga",
    customEmoji: "pepeGun",
  },
  {
    match: "banana",
    text: ":banana:",
  },
  {
    match: "bedge",
    react: "bedge",
  },
  {
    match: "klank",
    weighted: true,
    responses: [
      { customEmoji: ":robot:", weight: 65 },
      { text: "Klank Klank", weight: 20 },
      {
        text: "https://klipy.com/gifs/terminator-terminator-robot-7",
        weight: 10,
      },
      { text: "KLANKER", weight: 5 },
    ],
  },
  {
    match: "clank",
    weighted: true,
    responses: [
      { customEmoji: ":robot:", weight: 65 },
      { text: "Clank Clank", weight: 20 },
      {
        text: "https://klipy.com/gifs/terminator-terminator-robot-7",
        weight: 10,
      },
      { text: "U called?", weight: 5 },
    ],
  },
  {
    match: "cringe",
    text: "https://klipy.com/gifs/cringe-diesfromcringe-1",
  },
  {
    match: "crindzfist",
    text: ":boxing_glove:",
  },
  {
    match: "doomfist",
    text: ":boxing_glove:",
  },
  {
    match: "dumfist",
    text: ":boxing_glove:",
  },
  {
    match: "heartstone",
    customEmoji: "peepoYellowCard",
  },
  {
    match: "liga",
    customEmoji: "monkikick",
  },
  {
    match: "genji",
    customEmoji: "PeepoStop",
  },
  {
    match: "kefir",
    text: "kefirek :arrow_right: :skull:",
    chance: 0.2,
  },
  {
    match: "monkey",
    text: ":monkey_face:",
  },
  {
    match: "monki",
    react: "🐵",
  },
  {
    match: "pepega",
    weighted: true,
    responses: [
      { text: "pepega", weight: 25 },
      { customEmoji: "pepega", weight: 15 },
      { react: "pepega", weight: 15 },
      { customEmoji: "okayge", weight: 15 },
      { react: "okayge", weight: 15 },
      { text: "PEPEGA!", weight: 5 },
      { text: "https://klipy.com/gifs/pepega-clap", weight: 5 },
      { text: "U called?", weight: 5 },
    ],
  },
  {
    match: "🐵",
    text: ":monkey:",
  },
  {
    match: "🐒",
    text: ":monkey_face:",
  },
  {
    match: "overwatch",
    text: ":monkey: :handshake:",
    customEmoji: "pepegaSit",
  },
  {
    match: "winston",
    react: ":6493winstare:",
  },
  {
    match: "winton",
    text: "https://klipy.com/gifs/winston-overwatch-13",
  },
];
