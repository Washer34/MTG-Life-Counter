import React, { useState } from 'react';
import { GameConfig, ManaColor } from '../types';
import { HAPTICS } from '../utils/haptics';
import './SetupScreen.css';

interface SetupScreenProps {
  onStartGame: (config: GameConfig, playerNames: string[], playerColors: ManaColor[]) => void;
}

const MANA_COLORS: { color: ManaColor; name: string; symbol: string }[] = [
  { color: 'white', name: 'Blanc', symbol: 'W' },
  { color: 'blue', name: 'Bleu', symbol: 'U' },
  { color: 'black', name: 'Noir', symbol: 'B' },
  { color: 'red', name: 'Rouge', symbol: 'R' },
  { color: 'green', name: 'Vert', symbol: 'G' },
  { color: 'colorless', name: 'Incolore', symbol: 'C' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState(4);
  const [startingLife, setStartingLife] = useState(40);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(6).fill('').map((_, i) => `Joueur ${i + 1}`)
  );
  const [playerColors, setPlayerColors] = useState<ManaColor[]>(
    ['white', 'blue', 'black', 'red', 'green', 'colorless']
  );

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handlePlayerColorChange = (index: number, color: ManaColor) => {
    const newColors = [...playerColors];
    newColors[index] = color;
    setPlayerColors(newColors);
    HAPTICS.selection();
  };

  const handleStartGame = () => {
    const config: GameConfig = {
      playerCount,
      startingLife,
    };
    HAPTICS.startGame();
    onStartGame(
      config,
      playerNames.slice(0, playerCount),
      playerColors.slice(0, playerCount)
    );
  };

  return (
    <div className="setup-screen">
      <div className="setup-backdrop" aria-hidden="true">
        <div className="backdrop-layer tapestry" />
        <div className="backdrop-layer light-rays" />
        <div className="backdrop-layer embers" />
      </div>
      <div className="setup-container ornate-border">
        <h1 className="setup-title">
          <span className="title-ornament">⚔</span>
          MTG Life Counter
          <span className="title-ornament">⚔</span>
        </h1>
        <p className="setup-subtitle">Configuration de la partie</p>

        <div className="setup-section">
          <label className="setup-label">
            <span>Nombre de joueurs</span>
            <select
              value={playerCount}
              onChange={(e) => {
                HAPTICS.selection();
                setPlayerCount(Number(e.target.value));
              }}
              className="setup-select"
            >
              {[2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} joueurs
                </option>
              ))}
            </select>
          </label>

          <label className="setup-label">
            <span>Points de vie de départ</span>
            <input
              type="number"
              value={startingLife}
              onChange={(e) => {
                HAPTICS.selection();
                setStartingLife(Number(e.target.value));
              }}
              min={1}
              max={200}
              className="setup-input"
            />
          </label>
        </div>

        <div className="players-config">
          <h2 className="section-title">Configuration des joueurs</h2>
          {Array.from({ length: playerCount }).map((_, index) => (
            <div key={index} className="player-config ornate-border-simple">
              <div className="player-config-header">
                <span className="player-number">Joueur {index + 1}</span>
              </div>
              <div className="player-config-body">
                <input
                  type="text"
                  value={playerNames[index]}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  className="player-name-input"
                  placeholder={`Joueur ${index + 1}`}
                  maxLength={20}
                />
                <div className="color-selector">
                  {MANA_COLORS.map(({ color, name, symbol }) => (
                    <button
                      key={color}
                      className={`color-button color-${color} ${
                        playerColors[index] === color ? 'selected' : ''
                      }`}
                      onClick={() => handlePlayerColorChange(index, color)}
                      title={name}
                      type="button"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleStartGame} className="start-button">
          <span>⚔ Commencer la partie ⚔</span>
        </button>
      </div>
    </div>
  );
};
