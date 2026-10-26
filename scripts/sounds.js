/*
  sounds.js
  ---------
  צלילים נוצרים "מהאוויר" עם Web Audio API (בלי קבצי mp3),
  ומילות עידוד מושמעות בקול עם SpeechSynthesis המובנה בדפדפן.
*/

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(frequency, duration, type = "sine", volume = 0.45) {
  if (audioCtx.state === "suspended") audioCtx.resume(); // דפדפנים מתחילים "מושתקים" עד לחיצה

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

const playPlaceSound = () => playTone(440, 0.12, "triangle", 0.12);   // הנחת צורה
const playErrorSound = () => playTone(140, 0.2, "sawtooth", 0.1);     // הנחה לא חוקית

// מחיקת שורות/טורים - גלישה עולה
const playClearSound = (linesCleared) => {
  for (let i = 0; i < Math.min(linesCleared, 4); i++) {
    setTimeout(() => playTone(523 + i * 120, 0.15, "sine", 0.15), i * 90);
  }
};

// סיום משחק - טון יורד
const playGameOverSound = () => {
  playTone(300, 0.3, "sawtooth", 0.12);
  setTimeout(() => playTone(180, 0.4, "sawtooth", 0.12), 250);
};

const PRAISE_WORDS = ["Great!",  "Nice!", "Fantastic!", "Unbelievable!", "Amazing!","Perfect!"];

const speakPraise = () => {
  if (!("speechSynthesis" in window)) return;
  const word = PRAISE_WORDS[Math.floor(Math.random() * PRAISE_WORDS.length)];
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 1.1;
  utterance.pitch = 1.3;
  speechSynthesis.speak(utterance);
};

// נקראת בכל מחיקת שורה/טור: צליל, ולפעמים גם מילת עידוד קולית.
// ככל שמוחקים יותר בבת אחת, גדל הסיכוי למילת עידוד.
const celebrateLinesCleared = (linesCleared) => {
  playClearSound(linesCleared);
  const praiseChance = linesCleared >= 2 ? 1 : 0.4;
  if (Math.random() < praiseChance) setTimeout(speakPraise, 200);
};
