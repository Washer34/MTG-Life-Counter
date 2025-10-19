import { useState, useEffect } from 'react';
import { GameState, GameConfig, Player, ManaColor, DamageShortcut } from './types';
import { SetupScreen } from './components/SetupScreen';
import { GameScreen } from './components/GameScreen';
import './App.css';

const STORAGE_KEY = 'mtg-life-counter-state';

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Attempt to lock orientation on supported devices
  useEffect(() => {
    const lockOrientation = async () => {
      const orientation = (screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation);
      if (screen.orientation && screen.orientation.lock) {
        try {
          await screen.orientation.lock('landscape');
        } catch {
          // noop - some browsers require user interaction or installation
        }
      } else if ((screen as any).lockOrientation) {
        try {
          (screen as any).lockOrientation('landscape');
        } catch {
          // noop
        }
      } else if (orientation && typeof orientation.lock === 'function') {
        try {
          await orientation.lock('landscape');
        } catch {
          // noop
        }
      }
    };
    lockOrientation();
  }, []);

  // Load saved game state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState(parsed);
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

  const handleStartGame = (
    config: GameConfig,
    playerNames: string[],
    playerColors: ManaColor[]
  ) => {
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
    }));

    const newGameState: GameState = {
      players,
      config,
      startTime: Date.now(),
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
      }));

      return {
        ...prev,
        players: resetPlayers,
        startTime: Date.now(),
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

      return { ...prev, players };
    });
  };

  const handleApplyLifeShortcut = (triggerPlayerId: string, shortcut: DamageShortcut) => {
    if (!shortcut.amount) return;

    setGameState((prev) => {
      if (!prev) return prev;

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

        return {
          ...player,
          life: player.life + shortcut.amount,
          lifeHistory: newHistory,
        };
      });

      return {
        ...prev,
        players,
      };
    });
  };

  return (
    <div className="app">
      {!gameState ? (
        <SetupScreen onStartGame={handleStartGame} />
      ) : (
        <GameScreen
          gameState={gameState}
          onUpdatePlayer={handleUpdatePlayer}
          onResetGame={handleResetGame}
          onNewGame={handleNewGame}
          onSetMonarch={handleSetMonarch}
          onApplyShortcut={handleApplyLifeShortcut}
        />
      )}
    </div>
  );
}

export default App;
