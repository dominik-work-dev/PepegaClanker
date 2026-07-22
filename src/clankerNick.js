const cron = require('node-cron');

// ID użytkownika, któremu zmieniamy nick
const TARGET_USER_ID = '1243899115331522622';
// ID serwera (guild), na którym ma się to dziać
const GUILD_ID = '1246964422916837517';

// Pula losowych nicków
const NICK_POOL = [
  'Sevi the Sorcerer',
  'Sevi the Bard',
  'Sevi the Spiritmaster',
  'Sevi the Pepega',
  'Sevi the Monki',
  'Sevi the Clanker',
  'Sevi the Isekai Anime Protagonist'
];

function getRandomNick() {
  return NICK_POOL[Math.floor(Math.random() * NICK_POOL.length)];
}

function startNicknameChanger(client) {
  cron.schedule('0 4 * * *', async () => {
    try {
      const guild = await client.guilds.fetch(GUILD_ID);
      const member = await guild.members.fetch(TARGET_USER_ID);
      const newNick = getRandomNick();

      await member.setNickname(newNick);
      console.log(`Zmieniono nick użytkownika ${member.user.tag} na: ${newNick}`);
    } catch (err) {
      console.error('Błąd przy zmianie nicku:', err);
    }
  }, {
    timezone: 'Europe/Warsaw'
  });

  console.log('Harmonogram zmiany nicku zainicjalizowany (4:00 Europe/Warsaw).');
}

module.exports = { startNicknameChanger };