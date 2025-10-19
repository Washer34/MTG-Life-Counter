import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types';
import { HAPTICS } from '../utils/haptics';
import './GameMenu.css';

interface GameMenuProps {
  gameState: GameState;
  onClose: () => void;
  onResetGame: () => void;
  onNewGame: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  gameState,
  onClose,
  onResetGame,
  onNewGame,
}) => {
  const [showDice, setShowDice] = useState(false);
  const [diceRolls, setDiceRolls] = useState<number[]>([]);
  const [diceConfig, setDiceConfig] = useState({ count: 1, sides: 6 });
  const [randomPlayer, setRandomPlayer] = useState<string | null>(null);
  const [coinResult, setCoinResult] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);
  const diceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const randomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coinTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playerPool, setPlayerPool] = useState<Record<string, boolean>>({});

  useEffect(() => {
    return () => {
      if (diceTimeoutRef.current) {
        clearTimeout(diceTimeoutRef.current);
        diceTimeoutRef.current = null;
      }
      if (randomTimeoutRef.current) {
        clearTimeout(randomTimeoutRef.current);
        randomTimeoutRef.current = null;
      }
      if (coinTimeoutRef.current) {
        clearTimeout(coinTimeoutRef.current);
        coinTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const initialPool: Record<string, boolean> = {};
    gameState.players.forEach(player => {
      initialPool[player.id] = playerPool[player.id] ?? true;
    });
    setPlayerPool(initialPool);
  }, [gameState.players]);

  const rollDice = (count: number, sides: number) => {
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    setDiceRolls(rolls);
    HAPTICS.diceRoll();
    if (diceTimeoutRef.current) {
      clearTimeout(diceTimeoutRef.current);
    }
    diceTimeoutRef.current = setTimeout(() => {
      setDiceRolls([]);
      diceTimeoutRef.current = null;
    }, 3500);
  };

  const pickRandomPlayer = () => {
    const eligiblePlayers = gameState.players.filter(player => playerPool[player.id]);
    const pool = eligiblePlayers.length > 0 ? eligiblePlayers : gameState.players;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setRandomPlayer(pool[randomIndex].name);
    HAPTICS.randomPlayer();
    if (randomTimeoutRef.current) {
      clearTimeout(randomTimeoutRef.current);
    }
    randomTimeoutRef.current = setTimeout(() => {
      setRandomPlayer(null);
      randomTimeoutRef.current = null;
    }, 3000);
  };

  const flipCoin = () => {
    const result = Math.random() < 0.5 ? 'Pile' : 'Face';
    setCoinResult(result);
    HAPTICS.selection();
    if (coinTimeoutRef.current) {
      clearTimeout(coinTimeoutRef.current);
    }
    coinTimeoutRef.current = setTimeout(() => {
      setCoinResult(null);
      coinTimeoutRef.current = null;
    }, 2500);
  };

  const handleResetGame = () => {
    HAPTICS.confirm();
    onResetGame();
    onClose();
  };

  const handleNewGame = () => {
    HAPTICS.confirm();
    onNewGame();
    onClose();
  };

  const handleClose = () => {
    HAPTICS.menuClose();
    onClose();
  };

  const getGameDuration = () => {
    const duration = Date.now() - gameState.startTime;
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="game-menu-overlay" onClick={handleClose}>
      <div className="game-menu ornate-border" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>✕</button>

        <h2 className="menu-title">
          <span className="title-ornament">⚔</span>
          Menu
          <span className="title-ornament">⚔</span>
        </h2>
        <div className="menu-scroll">

        <div className="menu-section">
          <div className="game-info">
            <div className="info-row">
              <span>Durée:</span>
              <span>{getGameDuration()}</span>
            </div>
            <div className="info-row">
              <span>Joueurs:</span>
              <span>{gameState.players.length}</span>
            </div>
            <div className="info-row">
              <span>Vie de départ:</span>
              <span>{gameState.config.startingLife}</span>
            </div>
          </div>
        </div>

        <div className="menu-section">
          <h3 className="section-title">Utilitaires</h3>

          <button
            className="menu-btn"
            onClick={() => {
              HAPTICS.selection();
              pickRandomPlayer();
            }}
          >
            🎲 Joueur aléatoire
          </button>

          <div className="random-player-config">
            {gameState.players.map((player) => (
              <button
                key={player.id}
                type="button"
                className={`player-chip ${playerPool[player.id] ? 'selected' : ''}`}
                onClick={() => {
                  HAPTICS.selection();
                  setPlayerPool(prev => ({
                    ...prev,
                    [player.id]: !prev[player.id],
                  }));
                }}
              >
                {player.name}
              </button>
            ))}
            <button
              type="button"
              className="player-chip reset"
              onClick={() => {
                HAPTICS.selection();
                const resetPool: Record<string, boolean> = {};
                gameState.players.forEach(p => {
                  resetPool[p.id] = true;
                });
                setPlayerPool(resetPool);
              }}
            >
              Tout sélectionner
            </button>
          </div>

          {randomPlayer && (
            <div className="random-result ornate-border-simple">
              👑 {randomPlayer}
            </div>
          )}

          <button
            className="menu-btn"
            onClick={() => {
              flipCoin();
            }}
          >
            🪙 Pile ou face
          </button>
          {coinResult && (
            <div className="coin-result ornate-border-simple">
              {coinResult}
            </div>
          )}

          <button
            className="menu-btn"
            onClick={() => {
              HAPTICS.selection();
              setShowDice(!showDice);
            }}
          >
            🎲 Lancer de dés
          </button>

          {showDice && (
            <div className="dice-section">
              <div className="dice-form">
                <label className="dice-label">
                  Nombre de dés
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={diceConfig.count}
                    onChange={(e) =>
                      setDiceConfig((prev) => ({
                        ...prev,
                        count: Math.min(10, Math.max(1, Number(e.target.value))),
                      }))
                    }
                  />
                </label>
                <label className="dice-label">
                  Faces
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={diceConfig.sides}
                    onChange={(e) =>
                      setDiceConfig((prev) => ({
                        ...prev,
                        sides: Math.min(100, Math.max(2, Number(e.target.value))),
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="dice-roll-btn"
                  onClick={() => rollDice(diceConfig.count, diceConfig.sides)}
                >
                  Lancer {diceConfig.count}d{diceConfig.sides}
                </button>
              </div>

              {diceRolls.length > 0 && (
                <div className="dice-result ornate-border-simple">
                  <div className="dice-result-rolls">
                    {diceRolls.map((roll, index) => (
                      <span key={index} className="dice-roll-chip">
                        {roll}
                      </span>
                    ))}
                  </div>
                  <div className="dice-result-total">
                    Total: {diceRolls.reduce((sum, value) => sum + value, 0)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="menu-section">
          <h3 className="section-title">Actions de partie</h3>

          {!showConfirmReset ? (
            <button
              className="menu-btn warning"
              onClick={() => {
                HAPTICS.selection();
                setShowConfirmReset(true);
              }}
            >
              🔄 Recommencer la partie
            </button>
          ) : (
            <div className="confirm-section">
              <p className="confirm-text">Remettre les compteurs à zéro ?</p>
              <div className="confirm-buttons">
                <button className="confirm-yes" onClick={handleResetGame}>
                  Oui
                </button>
                <button
                  className="confirm-no"
                  onClick={() => {
                    HAPTICS.cancel();
                    setShowConfirmReset(false);
                  }}
                >
                  Non
                </button>
              </div>
            </div>
          )}

          {!showConfirmNew ? (
            <button
              className="menu-btn danger"
              onClick={() => {
                HAPTICS.selection();
                setShowConfirmNew(true);
              }}
            >
              🏠 Nouvelle partie
            </button>
          ) : (
            <div className="confirm-section">
              <p className="confirm-text">Retour au menu principal ?</p>
              <div className="confirm-buttons">
                <button className="confirm-yes" onClick={handleNewGame}>
                  Oui
                </button>
                <button
                  className="confirm-no"
                  onClick={() => {
                    HAPTICS.cancel();
                    setShowConfirmNew(false);
                  }}
                >
                  Non
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        <button
          className="menu-btn-close"
          onClick={handleClose}
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
