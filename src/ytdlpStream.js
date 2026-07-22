const { spawn } = require("child_process");
const prism = require("prism-media");
const path = require("path");
const fs = require("fs");

let cookiesFilePath = null;

function prepareCookiesFile() {
  const content = process.env.YTDLP_COOKIES_CONTENT;
  if (!content) return;

  const testPath = path.join("/tmp", "cookies.txt");

  try {
    fs.writeFileSync(testPath, content);
    cookiesFilePath = testPath;
    console.log("[cookies] Zapisano cookies do", testPath);
  } catch (err) {
    console.warn("[cookies] Nie udało się zapisać pliku (", err.message, "), użyję /dev/stdin jako fallback");
    cookiesFilePath = null;
  }
}

function getCookiesFilePath() {
  return cookiesFilePath;
}

/**
 * Tworzy strumień audio (PCM s16le 48kHz stereo) na podstawie URL-a,
 * używając yt-dlp (pobieranie/ekstrakcja) + ffmpeg (transkodowanie).
 * @param {string} url
 * @returns {import('prism-media').FFmpeg}
 */
function createYtDlpStream(url) {
  const cookiesContent = process.env.YTDLP_COOKIES_CONTENT;
  const useStdinCookies = Boolean(cookiesContent) && !cookiesFilePath;
  const args = [
    url,
    "-f",
    "bestaudio/best",
    "-o",
    "-",
    "--quiet",
    "--no-warnings",
    "--no-playlist",
  ];

  if (cookiesFilePath) {
    // Wariant 1: mamy zapisany plik na /tmp
    args.push("--cookies", cookiesFilePath);
  } else if (useStdinCookies) {
    // Wariant 2: fallback bez zapisu na dysk
    args.push("--cookies", "/dev/stdin");
  }

  const ytdlp = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });

  if (useStdinCookies) {
    ytdlp.stdin.write(cookiesContent);
    ytdlp.stdin.end();
  }

  ytdlp.stderr.on("data", (chunk) => {
    console.error("[yt-dlp stderr]", chunk.toString());
  });

  ytdlp.on("error", (err) => {
    console.error("Nie udało się uruchomić yt-dlp:", err);
  });

  const ffmpeg = new prism.FFmpeg({
    args: [
      "-analyzeduration",
      "0",
      "-loglevel",
      "0",
      "-i",
      "pipe:0",
      "-f",
      "s16le",
      "-ar",
      "48000",
      "-ac",
      "2",
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


module.exports = { createYtDlpStream, prepareCookiesFile, getCookiesFilePath };
