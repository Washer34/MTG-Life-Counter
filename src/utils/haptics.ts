type VibrationPattern = number | number[];

const canVibrate = (): boolean => (
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function'
);

const vibrate = (pattern: VibrationPattern) => {
  if (!canVibrate()) return;
  navigator.vibrate(pattern);
};

const strongPulse = [0, 32, 24, 32] as const;
const mediumPulse = [0, 22, 18, 22] as const;
const lightPulse = 16;

export const HAPTICS = {
  lifeChange(amount: number) {
    if (!amount) return;
    const intensity = Math.min(3, Math.max(1, Math.ceil(Math.abs(amount) / 5)));
    if (amount > 0) {
      if (intensity === 1) vibrate([lightPulse]);
      else if (intensity === 2) vibrate([0, 16, 30, 16]);
      else vibrate([0, 20, 28, 20, 28, 20]);
    } else {
      if (intensity === 1) vibrate([0, 26]);
      else if (intensity === 2) vibrate([0, 28, 36, 28]);
      else vibrate([0, 32, 28, 32, 42, 32]);
    }
  },
  counterChange(amount: number) {
    if (!amount) return;
    vibrate(amount > 0 ? mediumPulse : strongPulse);
  },
  commanderDamage(amount: number) {
    if (!amount) return;
    vibrate(amount > 0 ? [0, 26, 18, 26, 18, 26] : [0, 32, 22, 32]);
  },
  undo() {
    vibrate([0, 14, 24, 14]);
  },
  confirm() {
    vibrate([0, 30, 20, 30, 20, 30]);
  },
  cancel() {
    vibrate([0, 18, 14, 18]);
  },
  eliminate() {
    vibrate([0, 20, 18, 20, 80, 50]);
  },
  revive() {
    vibrate([0, 24, 24, 36]);
  },
  monarch() {
    vibrate([0, 28, 18, 18, 18, 28]);
  },
  menuOpen() {
    vibrate(lightPulse);
  },
  menuClose() {
    vibrate([0, 18, 26, 18]);
  },
  selection() {
    vibrate(lightPulse);
  },
  diceRoll() {
    vibrate([0, 12, 18, 12, 18, 12]);
  },
  randomPlayer() {
    vibrate([0, 22, 18, 22, 18, 40]);
  },
  startGame() {
    vibrate([0, 26, 22, 26]);
  },
};

export const isHapticsAvailable = canVibrate;
