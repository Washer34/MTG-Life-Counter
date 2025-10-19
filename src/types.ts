// Magic colors for player customization
export type ManaColor = 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless';

export type DamageShortcutScope = 'all' | 'others' | 'self';

export interface DamageShortcut {
  id: string;
  label: string;
  amount: number;
  scope: DamageShortcutScope;
}

// Player state
export interface Player {
  id: string;
  name: string;
  color: ManaColor;
  life: number;
  poison: number;
  energy: number;
  experience: number;
  commanderDamage: Record<string, number>; // damage from each opponent's commander
  lifeHistory?: number[]; // Track last few life changes for undo
  isMonarch?: boolean; // Is this player the Monarch
  damageShortcuts?: DamageShortcut[];
  commanderCastCount?: number;
  treasures?: number;
  clues?: number;
  emblems?: number;
}

// Game configuration
export interface GameConfig {
  playerCount: number;
  startingLife: number;
}

// Game state
export interface GameState {
  players: Player[];
  config: GameConfig;
  startTime: number;
}

// Dice types
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
