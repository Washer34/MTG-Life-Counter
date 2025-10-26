import React, { useState } from 'react';
import {
  GameState,
  Player,
  DamageShortcut,
  GameLogDraft,
  ThemeId,
  GameLogEntry,
} from '../types';
import { PlayerCard } from './PlayerCard';
import { GameMenu } from './GameMenu';
import { HAPTICS } from '../utils/haptics';
import { THEME_DEFINITIONS } from '../utils/themes';
import './GameScreen.css';

interface GameScreenProps {
  gameState: GameState;
  log: GameLogEntry[];
  selectedTheme: ThemeId;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onResetGame: () => void;
  onNewGame: () => void;
  onSetMonarch: (playerId: string | null) => void;
  onApplyShortcut: (playerId: string, shortcut: DamageShortcut) => void;
  onLog: (entry: GameLogDraft) => void;
  onChangeTheme: (themeId: ThemeId) => void;
  onClearLog: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  log,
  selectedTheme,
  onUpdatePlayer,
  onResetGame,
  onNewGame,
  onSetMonarch,
  onApplyShortcut,
  onLog,
  onChangeTheme,
  onClearLog,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { players } = gameState;
  const themeDefinition = THEME_DEFINITIONS.find((theme) => theme.id === selectedTheme);
  const playerVariants = themeDefinition?.playerVariants ?? [];

  // Calculate layout based on player count
  const getLayoutClass = () => {
    const count = players.length;
    if (count === 2) return 'layout-2';
    if (count === 3) return 'layout-3';
    if (count === 4) return 'layout-4';
    if (count === 5) return 'layout-5';
    if (count === 6) return 'layout-6';
    return 'layout-4';
  };

  return (
    <div className="game-screen">
      <div className={`players-grid ${getLayoutClass()}`}>
        {players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            allPlayers={players}
            onUpdate={(updates) => onUpdatePlayer(player.id, updates)}
            onSetMonarch={(active) => onSetMonarch(active ? player.id : null)}
            onApplyShortcut={(shortcut) => onApplyShortcut(player.id, shortcut)}
            onLog={onLog}
            variant={playerVariants.length ? playerVariants[index % playerVariants.length] : undefined}
          />
        ))}
      </div>

      <button
        className="menu-button ornate-border-simple"
        onClick={() => {
          HAPTICS.menuOpen();
          setMenuOpen(true);
        }}
      >
        ☰
      </button>

      {menuOpen && (
        <GameMenu
          gameState={gameState}
          log={log}
          selectedTheme={selectedTheme}
          onClose={() => setMenuOpen(false)}
          onResetGame={onResetGame}
          onNewGame={onNewGame}
          onChangeTheme={onChangeTheme}
          onClearLog={onClearLog}
        />
      )}

    </div>
  );
};
