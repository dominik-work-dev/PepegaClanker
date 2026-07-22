const { spawn } = require("child_process");
const prism = require("prism-media");

/**
 * Tworzy strumień audio (PCM s16le 48kHz stereo) na podstawie URL-a,
 * używając yt-dlp (pobieranie/ekstrakcja) + ffmpeg (transkodowanie).
 * @param {string} url
 * @returns {import('prism-media').FFmpeg}
 */
function createYtDlpStream(url) {
  const args = [
    url,
    "-f", "bestaudio",
    "-o", "-",
    "--quiet",
    "--no-warnings",
    "--no-playlist",
  ];

  // Jeśli ustawiono ścieżkę do pliku cookies (potrzebne, gdy YouTube
  // żąda "Sign in to confirm you're not a bot"), dołącz ją do yt-dlp.
  if (process.env.YTDLP_COOKIES_PATH) {
    args.push("--cookies", process.env.YTDLP_COOKIES_PATH);
  }

  const ytdlp = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });

  ytdlp.stderr.on("data", (chunk) => {
    console.error("[yt-dlp stderr]", chunk.toString());
  });

  ytdlp.on("error", (err) => {
    console.error("Nie udało się uruchomić yt-dlp:", err);
  });

  const ffmpeg = new prism.FFmpeg({
    args: [
      "-analyzeduration", "0",
      "-loglevel", "0",
      "-i", "pipe:0",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2",
    ],
  });

  ytdlp.stdout.pipe(ffmpeg);

  // Sprzątanie: gdy ffmpeg/stream się zakończy lub padnie błąd, zabij proces yt-dlp
  const cleanup = () => {
    if (!ytdlp.killed) ytdlp.kill("SIGKILL");
  };
  ffmpeg.on("close", cleanup);
  ffmpeg.on("error", cleanup);

  return ffmpeg;
}

module.exports = { createYtDlpStream };