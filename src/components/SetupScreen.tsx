import React, { useState } from 'react';
import { GameConfig, ManaColor, ThemeId } from '../types';
import { HAPTICS } from '../utils/haptics';
import './SetupScreen.css';

interface SetupScreenProps {
  onStartGame: (config: GameConfig, playerNames: string[], playerColors: ManaColor[]) => void;
  selectedTheme: ThemeId;
}

const MANA_COLORS: { color: ManaColor; name: string; symbol: string }[] = [
  { color: 'white', name: 'Blanc', symbol: 'W' },
  { color: 'blue', name: 'Bleu', symbol: 'U' },
  { color: 'black', name: 'Noir', symbol: 'B' },
  { color: 'red', name: 'Rouge', symbol: 'R' },
  { color: 'green', name: 'Vert', symbol: 'G' },
  { color: 'colorless', name: 'Incolore', symbol: 'C' },
];

const DEFAULT_PLAYER_NAMES = Array.from({ length: 6 }, (_, i) => `Joueur ${i + 1}`);
const CUSTOM_OPTION_VALUE = '__custom__';

const RECURRING_PLAYERS = [
  'Alexandre',
  'Antoine',
  'Aurélien',
  'Axel',
  'Charlène',
  'Corentin',
  'Lisa',
  'Maxime',
  'Pierre',
  'Romain',
  'Simon',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame, selectedTheme }) => {
  const [playerCount, setPlayerCount] = useState(4);
  const [startingLife, setStartingLife] = useState(40);
  const [playerNames, setPlayerNames] = useState<string[]>([...DEFAULT_PLAYER_NAMES]);
  const [playerColors, setPlayerColors] = useState<ManaColor[]>(
    ['white', 'blue', 'black', 'red', 'green', 'colorless']
  );
  const [customNameEnabled, setCustomNameEnabled] = useState<boolean[]>(Array(6).fill(false));

  const handlePlayerNameSelect = (index: number, name: string) => {
    if (name === CUSTOM_OPTION_VALUE) {
      setCustomNameEnabled((prev) => {
        const next = [...prev];
        next[index] = true;
        return next;
      });
      setPlayerNames((prev) => {
        const next = [...prev];
        if (
          next[index] === DEFAULT_PLAYER_NAMES[index] ||
          RECURRING_PLAYERS.includes(next[index])
        ) {
          next[index] = '';
        }
        return next;
      });
      HAPTICS.selection();
      return;
    }

    const allowed =
      name === DEFAULT_PLAYER_NAMES[index] || RECURRING_PLAYERS.includes(name);
    if (!allowed) return;

    setCustomNameEnabled((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = false;
      return next;
    });

    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    if (name !== DEFAULT_PLAYER_NAMES[index]) {
      HAPTICS.selection();
    }
  };

  const handleCustomNameChange = (index: number, value: string) => {
    const nextNames = [...playerNames];
    nextNames[index] = value;
    setPlayerNames(nextNames);
  };

  const handleCustomNameBlur = (index: number) => {
    const trimmed = playerNames[index].trim();
    if (!trimmed) {
      setPlayerNames((prev) => {
        const next = [...prev];
        next[index] = DEFAULT_PLAYER_NAMES[index];
        return next;
      });
      setCustomNameEnabled((prev) => {
        if (!prev[index]) return prev;
        const next = [...prev];
        next[index] = false;
        return next;
      });
    } else {
      setPlayerNames((prev) => {
        const next = [...prev];
        next[index] = trimmed;
        return next;
      });
    }
  };

  const handleCancelCustomName = (index: number) => {
    setCustomNameEnabled((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      next[index] = false;
      return next;
    });
    setPlayerNames((prev) => {
      const next = [...prev];
      next[index] = DEFAULT_PLAYER_NAMES[index];
      return next;
    });
    HAPTICS.cancel();
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
      themeId: selectedTheme,
    };
    const sanitizedNames = playerNames.map((name, index) => {
      const trimmed = name.trim();
      if (customNameEnabled[index]) {
        return trimmed || DEFAULT_PLAYER_NAMES[index];
      }
      if (
        trimmed === DEFAULT_PLAYER_NAMES[index] ||
        RECURRING_PLAYERS.includes(trimmed)
      ) {
        return trimmed;
      }
      return DEFAULT_PLAYER_NAMES[index];
    });

    const nextCustomFlags = customNameEnabled.map((flag, index) => {
      if (!flag) return false;
      return sanitizedNames[index] !== DEFAULT_PLAYER_NAMES[index];
    });

    setPlayerNames(sanitizedNames);
    setCustomNameEnabled(nextCustomFlags);

    HAPTICS.startGame();
    onStartGame(
      config,
      sanitizedNames.slice(0, playerCount),
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
                <select
                  className="player-name-dropdown"
                  value={
                    customNameEnabled[index]
                      ? CUSTOM_OPTION_VALUE
                      : playerNames[index]
                  }
                  onChange={(e) => handlePlayerNameSelect(index, e.target.value)}
                >
                  <option value={DEFAULT_PLAYER_NAMES[index]}>
                    {DEFAULT_PLAYER_NAMES[index]}
                  </option>
                  {RECURRING_PLAYERS.map((name) => (
                    <option value={name} key={name}>
                      {name}
                    </option>
                  ))}
                  <option value={CUSTOM_OPTION_VALUE}>Autre prénom…</option>
                </select>
                {customNameEnabled[index] && (
                  <div className="player-name-custom-row">
                    <input
                      type="text"
                      className="player-name-input"
                      value={playerNames[index]}
                      onChange={(e) => handleCustomNameChange(index, e.target.value)}
                      onBlur={() => handleCustomNameBlur(index)}
                      placeholder="Entrez un prénom"
                      maxLength={20}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="player-name-cancel"
                      onClick={() => handleCancelCustomName(index)}
                      aria-label="Annuler le prénom personnalisé"
                    >
                      ✕
                    </button>
                  </div>
                )}
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
