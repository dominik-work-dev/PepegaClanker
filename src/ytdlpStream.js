// src/ytdlpStream.js
const { spawn } = require("child_process");
const prism = require("prism-media");

function createYtDlpStream(url) {
  const ytdlp = spawn(
    "yt-dlp",
    [
      url,
      "-f", "bestaudio",
      "-o", "-",
      "--quiet",
      "--no-warnings",
      "--no-playlist",
    ],
    { stdio: ["ignore", "pipe", "pipe"] } // pipe stderr żeby móc logować błędy
  );

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

  return ffmpeg; // to jest Twój playStream
}

module.exports = { createYtDlpStream };