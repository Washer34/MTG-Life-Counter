import { useState, useEffect } from 'react';
import {
  GameState,
  GameConfig,
  Player,
  ManaColor,
  DamageShortcut,
  ThemeId,
  GameLogDraft,
  GameLogEntry,
  InitiativeState,
  InitiativeFace,
  InitiativeTokenPosition,
} from './types';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import { applyTheme, loadStoredTheme, storeTheme } from './utils/theme';
import { THEME_DEFINITIONS } from './utils/themes';
import './App.css';

const STORAGE_KEY = 'mtg-life-counter-state';
const LOG_LIMIT = 80;

const DEFAULT_TOKEN_SPOTS: InitiativeTokenPosition[] = [
  { x: 18, y: 12 },
  { x: 34, y: 12 },
  { x: 50, y: 12 },
  { x: 66, y: 12 },
  { x: 26, y: 20 },
  { x: 58, y: 20 },
];
type OrientationLock =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

const createLogEntry = (entry: GameLogDraft): GameLogEntry => ({
  id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  timestamp: Date.now(),
  ...entry,
});

const pushLogEntries = (log: GameLogEntry[] = [], entries: GameLogDraft[]) => {
  if (entries.length === 0) return log;
  const nextLog = [...log, ...entries.map(createLogEntry)];
  return nextLog.length > LOG_LIMIT ? nextLog.slice(nextLog.length - LOG_LIMIT) : nextLog;
};

const getThemeName = (themeId: ThemeId) =>
  THEME_DEFINITIONS.find((theme) => theme.id === themeId)?.name ?? themeId;

const createDefaultInitiativeState = (players: Player[]): InitiativeState => {
  const tokenPositions: Record<string, InitiativeTokenPosition> = {};
  players.forEach((player, index) => {
    tokenPositions[player.id] =
      DEFAULT_TOKEN_SPOTS[index % DEFAULT_TOKEN_SPOTS.length] ?? { x: 50, y: 85 };
  });
  return {
    activeFace: 'initiative',
    tokenPositions,
  };
};

const ensureInitiativeState = (
  players: Player[],
  state?: InitiativeState | null
): InitiativeState => {
  const base = state ?? createDefaultInitiativeState(players);
  const nextPositions: Record<string, InitiativeTokenPosition> = {};

  players.forEach((player, index) => {
    nextPositions[player.id] =
      base.tokenPositions[player.id] ??
      DEFAULT_TOKEN_SPOTS[index % DEFAULT_TOKEN_SPOTS.length] ??
      { x: 50, y: 85 };
  });

  return {
    activeFace: base.activeFace ?? 'initiative',
    tokenPositions: nextPositions,
  };
};

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('classic');

  // Attempt to lock orientation on supported devices
  useEffect(() => {
    const lockOrientation = async () => {
      const anyScreen = screen as Screen & {
        orientation?: ScreenOrientation & { lock?: (orientation: OrientationLock) => Promise<void> };
        lockOrientation?: (orientation: string) => Promise<void> | boolean;
        mozLockOrientation?: (orientation: string) => Promise<void> | boolean;
        msLockOrientation?: (orientation: string) => Promise<void> | boolean;
      };

      try {
        if (anyScreen.orientation?.lock) {
          await anyScreen.orientation.lock('landscape');
        } else if (typeof anyScreen.lockOrientation === 'function') {
          anyScreen.lockOrientation('landscape');
        } else if (typeof anyScreen.mozLockOrientation === 'function') {
          anyScreen.mozLockOrientation('landscape');
        } else if (typeof anyScreen.msLockOrientation === 'function') {
          anyScreen.msLockOrientation('landscape');
        }
      } catch {
        // silently ignore when lock is unavailable or rejected
      }
    };
    lockOrientation();
  }, []);

  // Load saved game state on mount and restore theme
  useEffect(() => {
    const storedTheme = loadStoredTheme();
    if (storedTheme) {
      setSelectedTheme(storedTheme);
    }

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const loadedTheme: ThemeId = parsed?.config?.themeId ?? storedTheme ?? 'classic';
        const normalisedPlayers: Player[] = (parsed.players ?? []).map((player: Player) => ({
          ...player,
          commanderDamage: player.commanderDamage ?? {},
          damageShortcuts: player.damageShortcuts ?? [],
          lifeHistory: player.lifeHistory ?? [],
          commanderCastCount: player.commanderCastCount ?? 0,
          treasures: player.treasures ?? 0,
          clues: player.clues ?? 0,
          emblems: player.emblems ?? 0,
          customResources: player.customResources ?? [],
        }));

        const initiativeState = ensureInitiativeState(normalisedPlayers, parsed?.initiativeState);

        const normalisedState: GameState = {
          players: normalisedPlayers,
          config: {
            ...parsed.config,
            playerCount: (parsed.config?.playerCount ?? normalisedPlayers.length) || 4,
            startingLife: parsed.config?.startingLife ?? 40,
            themeId: loadedTheme,
          },
          startTime: parsed.startTime ?? Date.now(),
          log: parsed.log ?? [],
          initiativeState,
        };

        setSelectedTheme(loadedTheme);
        setGameState(normalisedState);
      } catch (e) {
        console.error('Failed to load saved game state:', e);
      }
    }
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  // Apply and persist theme whenever it changes
  useEffect(() => {
    applyTheme(selectedTheme);
    storeTheme(selectedTheme);
  }, [selectedTheme]);

  const appendLog = (entry: GameLogDraft) => {
    setGameState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        log: pushLogEntries(prev.log, [entry]),
      };
    });
  };

  const handleSelectTheme = (themeId: ThemeId) => {
    if (themeId === selectedTheme) return;
    setSelectedTheme(themeId);
    setGameState((prev) => {
      if (!prev) return prev;
      const entries: GameLogDraft[] = [
        {
          type: 'info',
          message: `Thème changé pour « ${getThemeName(themeId)} ».`,
        },
      ];
      return {
        ...prev,
        config: { ...prev.config, themeId },
        log: pushLogEntries(prev.log, entries),
      };
    });
  };

  const handleClearLog = () => {
    setGameState((prev) => {
      if (!prev) return prev;
      return { ...prev, log: [] };
    });
  };

  const handleStartGame = (
    config: GameConfig,
    playerNames: string[],
    playerColors: ManaColor[]
  ) => {
    if (config.themeId !== selectedTheme) {
      setSelectedTheme(config.themeId);
    }
    const players: Player[] = playerNames.map((name, index) => ({
      id: `player-${index}`,
      name,
      color: playerColors[index],
      life: config.startingLife,
      poison: 0,
      energy: 0,
      experience: 0,
      commanderDamage: {},
      lifeHistory: [],
      damageShortcuts: [],
      commanderCastCount: 0,
      treasures: 0,
      clues: 0,
      emblems: 0,
      customResources: [],
    }));

    const newGameState: GameState = {
      players,
      config,
      startTime: Date.now(),
      log: [],
      initiativeState: createDefaultInitiativeState(players),
    };

    setGameState(newGameState);
  };

  const handleUpdatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        players: prev.players.map((player) =>
          player.id === playerId ? { ...player, ...updates } : player
        ),
      };
    });
  };

  const handleResetGame = () => {
    setGameState((prev) => {
      if (!prev) return prev;

      const resetPlayers: Player[] = prev.players.map((player) => ({
        ...player,
        life: prev.config.startingLife,
        poison: 0,
        energy: 0,
        experience: 0,
        commanderDamage: {},
        lifeHistory: [],
        commanderCastCount: 0,
        treasures: 0,
        clues: 0,
        emblems: 0,
        customResources: (player.customResources ?? []).map((resource) => ({
          ...resource,
          value: 0,
        })),
      }));

      return {
        ...prev,
        players: resetPlayers,
        startTime: Date.now(),
        initiativeState: createDefaultInitiativeState(resetPlayers),
        log: pushLogEntries([], [
          {
            type: 'info',
            message: 'La partie est réinitialisée.',
          },
        ]),
      };
    });
  };

  const handleNewGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(null);
  };

  const handleSetMonarch = (playerId: string | null) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const players = prev.players.map((player) => ({
        ...player,
        isMonarch: playerId ? player.id === playerId : false,
      }));

      const target = playerId ? prev.players.find((player) => player.id === playerId) : null;
      const entries: GameLogDraft[] = [
        playerId && target
          ? {
              type: 'monarch',
              message: `${target.name} devient le Monarque.`,
              playerIds: [target.id],
            }
          : {
              type: 'monarch',
              message: 'La couronne est abandonnée.',
            },
      ];

      return {
        ...prev,
        players,
        log: pushLogEntries(prev.log, entries),
      };
    });
  };

  const handleApplyLifeShortcut = (triggerPlayerId: string, shortcut: DamageShortcut) => {
    if (!shortcut.amount) return;

    setGameState((prev) => {
      if (!prev) return prev;

      const initiator = prev.players.find((player) => player.id === triggerPlayerId);
      const entries: GameLogDraft[] = [];
      const players = prev.players.map((player) => {
        const applies =
          shortcut.scope === 'all' ||
          (shortcut.scope === 'self' && player.id === triggerPlayerId) ||
          (shortcut.scope === 'others' && player.id !== triggerPlayerId);

        if (!applies) {
          return player;
        }

        const history = player.lifeHistory || [];
        const newHistory = [player.life, ...history].slice(0, 5);
        const newLife = player.life + shortcut.amount;

        const originLabel = shortcut.label ? `« ${shortcut.label} »` : 'un raccourci';
        const sourceLabel = initiator ? ` par ${initiator.name}` : '';
        entries.push({
          type: 'shortcut',
          message: `${player.name} ${shortcut.amount > 0 ? '+' : ''}${shortcut.amount} PV via ${originLabel}${sourceLabel} (→ ${newLife} PV).`,
          playerIds: [player.id],
        });

        return {
          ...player,
          life: newLife,
          lifeHistory: newHistory,
        };
      });

      return {
        ...prev,
        players,
        log: pushLogEntries(prev.log, entries),
      };
    });
  };

  const handleSetInitiativeFace = (face: InitiativeFace) => {
    setGameState((prev) => {
      if (!prev) return prev;
      if (prev.initiativeState.activeFace === face) return prev;

      return {
        ...prev,
        initiativeState: {
          ...prev.initiativeState,
          activeFace: face,
        },
      };
    });
  };

  const handleMoveInitiativeToken = (playerId: string, position: InitiativeTokenPosition) => {
    setGameState((prev) => {
      if (!prev) return prev;
      if (!prev.players.some((player) => player.id === playerId)) return prev;
      const nextState = ensureInitiativeState(prev.players, prev.initiativeState);

      return {
        ...prev,
        initiativeState: {
          ...nextState,
          tokenPositions: {
            ...nextState.tokenPositions,
            [playerId]: position,
          },
        },
      };
    });
  };

  return (
    <div className="app">
      {!gameState ? (
        <SetupScreen
          onStartGame={handleStartGame}
          selectedTheme={selectedTheme}
        />
      ) : (
        <GameScreen
          gameState={gameState}
          log={gameState.log}
          selectedTheme={selectedTheme}
          onUpdatePlayer={handleUpdatePlayer}
          onResetGame={handleResetGame}
          onNewGame={handleNewGame}
          onSetMonarch={handleSetMonarch}
          onApplyShortcut={handleApplyLifeShortcut}
          onLog={appendLog}
          onChangeTheme={handleSelectTheme}
          onClearLog={handleClearLog}
          onSetInitiativeFace={handleSetInitiativeFace}
          onMoveInitiativeToken={handleMoveInitiativeToken}
        />
      )}
    </div>
  );
}

export default App;
