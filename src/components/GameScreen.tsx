import React, { useState } from 'react';
import { GameState, Player, DamageShortcut } from '../types';
import { PlayerCard } from './PlayerCard';
import { GameMenu } from './GameMenu';
import { HAPTICS } from '../utils/haptics';
import './GameScreen.css';

interface GameScreenProps {
  gameState: GameState;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onResetGame: () => void;
  onNewGame: () => void;
  onSetMonarch: (playerId: string | null) => void;
  onApplyShortcut: (playerId: string, shortcut: DamageShortcut) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  onUpdatePlayer,
  onResetGame,
  onNewGame,
  onSetMonarch,
  onApplyShortcut,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { players } = gameState;

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
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            allPlayers={players}
            onUpdate={(updates) => onUpdatePlayer(player.id, updates)}
            onSetMonarch={(active) => onSetMonarch(active ? player.id : null)}
            onApplyShortcut={(shortcut) => onApplyShortcut(player.id, shortcut)}
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
          onClose={() => setMenuOpen(false)}
          onResetGame={onResetGame}
          onNewGame={onNewGame}
        />
      )}
    </div>
  );
};
