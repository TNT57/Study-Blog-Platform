// A short "ding-ding" made with the Web Audio API: no sound file to download.
//
// Browsers only allow sound after the user has clicked something on the page, so the timer
// calls unlockSound() from the Start button, and playChime() later, when the round ends.

let context: AudioContext | null = null;

export function unlockSound() {
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    // No Web Audio (very old browser, or a test): the timer simply stays silent.
  }
}

export function playChime() {
  if (!context) return;
  const start = context.currentTime;
  for (const offset of [0, 0.3]) {
    const tone = context.createOscillator();
    const volume = context.createGain();
    tone.frequency.value = 880; // the note A5
    volume.gain.setValueAtTime(0.0001, start + offset);
    volume.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.25);
    tone.connect(volume).connect(context.destination);
    tone.start(start + offset);
    tone.stop(start + offset + 0.3);
  }
}
