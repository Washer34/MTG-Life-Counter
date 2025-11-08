// Magic colors for player customization
export type ManaColor = 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless';

export type DamageShortcutScope = 'all' | 'others' | 'self';

export type ThemeId = 'classic' | 'innistrad' | 'ixalan' | 'phyrexia';

export interface ThemePlayerVariant {
  id: string;
  name: string;
  overlay: string;
  border: string;
  accent: string;
  glow: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  preview: string;
  playerVariants: ThemePlayerVariant[];
}

export interface DamageShortcut {
  id: string;
  label: string;
  amount: number;
  scope: DamageShortcutScope;
}

export interface CustomResource {
  id: string;
  label: string;
  icon: string;
  value: number;
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
  customResources?: CustomResource[];
}

export type InitiativeFace = 'initiative' | 'undercity';

export interface InitiativeTokenPosition {
  x: number;
  y: number;
}

export interface InitiativeState {
  activeFace: InitiativeFace;
  tokenPositions: Record<string, InitiativeTokenPosition>;
}

export type GameLogEntryType =
  | 'life'
  | 'resource'
  | 'commander'
  | 'shortcut'
  | 'monarch'
  | 'info';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  type: GameLogEntryType;
  message: string;
  playerIds?: string[];
}

export type GameLogDraft = Omit<GameLogEntry, 'id' | 'timestamp'>;

// Game configuration
export interface GameConfig {
  playerCount: number;
  startingLife: number;
  themeId: ThemeId;
}

// Game state
export interface GameState {
  players: Player[];
  config: GameConfig;
  startTime: number;
  log: GameLogEntry[];
  initiativeState: InitiativeState;
}

// Dice types
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
