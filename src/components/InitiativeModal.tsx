import React, { useRef, useState } from 'react';
import {
  InitiativeFace,
  InitiativeState,
  InitiativeTokenPosition,
  ManaColor,
  Player,
} from '../types';
import { HAPTICS } from '../utils/haptics';
import './InitiativeModal.css';

interface InitiativeModalProps {
  players: Player[];
  initiativeState: InitiativeState;
  onClose: () => void;
  onSetFace: (face: InitiativeFace) => void;
  onMoveToken: (playerId: string, position: InitiativeTokenPosition) => void;
}

const COLOR_MAP: Record<ManaColor, string> = {
  white: '#fff4ce',
  blue: '#7dc3ff',
  black: '#8a6fbc',
  red: '#ff8d7c',
  green: '#62c98a',
  colorless: '#d6d6d6',
};

const clamp = (value: number, min = 2, max = 98) => Math.min(max, Math.max(min, value));

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const InitiativeModal: React.FC<InitiativeModalProps> = ({
  players,
  initiativeState,
  onClose,
  onSetFace,
  onMoveToken,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const isUndercity = initiativeState.activeFace === 'undercity';
  const cardSrc = isUndercity ? '/Undercity.jpg' : '/Initiative.jpg';

  const handleClose = () => {
    HAPTICS.cancel();
    onClose();
  };

  const handleToggleFace = () => {
    HAPTICS.selection();
    onSetFace(isUndercity ? 'initiative' : 'undercity');
  };

  const updatePositionFromPointer = (playerId: string, clientX: number, clientY: number) => {
    const board = boardRef.current;
    if (!board) return;
    const bounds = board.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    const relativeX = ((clientX - bounds.left) / bounds.width) * 100;
    const relativeY = ((clientY - bounds.top) / bounds.height) * 100;
    onMoveToken(playerId, {
      x: clamp(relativeX),
      y: clamp(relativeY),
    });
  };

  const handlePointerDown = (playerId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingId(playerId);
    updatePositionFromPointer(playerId, event.clientX, event.clientY);
  };

  const handlePointerMove = (playerId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    if (draggingId !== playerId) return;
    updatePositionFromPointer(playerId, event.clientX, event.clientY);
  };

  const handlePointerUp = (playerId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    if (draggingId !== playerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    updatePositionFromPointer(playerId, event.clientX, event.clientY);
    setDraggingId(null);
  };

  const handlePointerCancel = (
    playerId: string,
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (draggingId !== playerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingId(null);
  };

  return (
    <div className="initiative-modal-overlay" onClick={handleClose}>
      <div
        className="initiative-modal ornate-border"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="initiative-close"
          onClick={handleClose}
          aria-label="Fermer la carte Initiative"
        >
          ×
        </button>
        <div className="initiative-board-wrapper">
          <div className="initiative-board" ref={boardRef}>
            <img
              src={cardSrc}
              alt={isUndercity ? 'Plan de l\'Undercity' : 'Carte Initiative'}
              className="initiative-card"
              draggable={false}
            />
            {isUndercity &&
              players.map((player) => {
                const position: InitiativeTokenPosition =
                  initiativeState.tokenPositions[player.id] ?? { x: 50, y: 85 };
                const initials = getInitials(player.name);
                return (
                  <button
                    key={player.id}
                    type="button"
                    className={`initiative-token ${
                      draggingId === player.id ? 'dragging' : ''
                    }`}
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      background: COLOR_MAP[player.color],
                    }}
                    onPointerDown={(event) => handlePointerDown(player.id, event)}
                    onPointerMove={(event) => handlePointerMove(player.id, event)}
                    onPointerUp={(event) => handlePointerUp(player.id, event)}
                    onPointerCancel={(event) => handlePointerCancel(player.id, event)}
                  >
                    {initials}
                  </button>
                );
              })}
          </div>
        </div>
        <div className="initiative-controls">
          <button
            type="button"
            className="initiative-flip-btn"
            onClick={handleToggleFace}
            aria-label={isUndercity ? 'Revenir à la carte Initiative' : 'Explorer l\'Undercity'}
            title={isUndercity ? 'Revenir à la carte Initiative' : 'Explorer l\'Undercity'}
          >
            {isUndercity ? '⟲' : '⟳'}
          </button>
        </div>
      </div>
    </div>
  );
};
