// audio.js
// Mirrors the pattern from the working co-worker implementation:
// - Audio objects created at module level
// - unlockAudio() does a muted play→pause inside the first user gesture
//   so iOS/Android marks every Audio element as "user-activated"
// - After unlock, .play() works even outside a gesture chain

import correctSfx  from './assets/sfx/Correct.mp3';
import completeSfx from './assets/sfx/complete.mp3';
import endcardSfx  from './assets/sfx/endcard.mp3';
import endsceneSfx from './assets/sfx/endscene.mp3';
import revealSfx   from './assets/sfx/complete.mp3';

export const correctAudio  = new Audio(correctSfx);
export const completeAudio = new Audio(completeSfx);
export const endcardAudio  = new Audio(endcardSfx);
export const endsceneAudio = new Audio(endsceneSfx);
export const revealAudio   = new Audio(revealSfx);

correctAudio.volume  = 1;
completeAudio.volume = 1;
endcardAudio.volume  = 1;
endsceneAudio.volume = 1;
revealAudio.volume   = 1;

let unlocked = false;

export const unlockAudio = () => {
  if (unlocked) return;
  unlocked = true;

  [correctAudio, completeAudio, endcardAudio, endsceneAudio, revealAudio].forEach(audio => {
    audio.muted = true;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }).catch(() => {
        audio.muted = false;
      });
    } else {
      audio.muted = false;
    }
  });
};

// Convenience play helpers — safe to call from anywhere after unlockAudio()
export const playCorrect = () => {
  correctAudio.currentTime = 0;
  correctAudio.play().catch(() => {});
};

export const playComplete = () => {
  completeAudio.currentTime = 0;
  completeAudio.play().catch(() => {});
};

export const playEndcard = () => {
  endcardAudio.currentTime = 0;
  endcardAudio.play().catch(() => {});
};

export const playEndscene = () => {
  endsceneAudio.currentTime = 0;
  endsceneAudio.play().catch(() => {});
};

export const playReveal = () => {
  revealAudio.currentTime = 0;
  revealAudio.play().catch(() => {});
};
