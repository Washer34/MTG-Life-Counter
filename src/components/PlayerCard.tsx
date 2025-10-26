import React, { useState, useRef, useEffect } from 'react';
import {
  Player,
  DamageShortcut,
  DamageShortcutScope,
  CustomResource,
  GameLogDraft,
  ThemePlayerVariant,
} from '../types';
import { HAPTICS } from '../utils/haptics';
import './PlayerCard.css';

type CSSPropertiesWithVars = React.CSSProperties & Record<string, string>;

interface PlayerCardProps {
  player: Player;
  allPlayers: Player[];
  onUpdate: (updates: Partial<Player>) => void;
  onSetMonarch: (active: boolean) => void;
  onApplyShortcut: (shortcut: DamageShortcut) => void;
  onLog: (entry: GameLogDraft) => void;
  variant?: ThemePlayerVariant;
}

type CardView = 'life' | 'counters' | 'commandZone' | 'commander' | 'settings';
const COMBO_IDLE_DELAY = 750;
const COMBO_FADE_DURATION = 250;
const shortcutScopeLabels: Record<DamageShortcutScope, string> = {
  all: 'Tous les joueurs',
  others: 'Adversaires',
  self: 'Moi uniquement',
};
const viewOrder: CardView[] = ['life', 'counters', 'commandZone', 'commander', 'settings'];
const CUSTOM_RESOURCE_ICONS = [
  '🩸',
  '🛡️',
  '💎',
  '🧪',
  '🍄',
  '🪙',
  '🔥',
  '💧',
  '🌿',
  '⚙️',
  '📜',
  '🐉',
];

interface CounterCardProps {
  icon: string;
  name: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

const CounterCard: React.FC<CounterCardProps> = ({ icon, name, value, onDecrease, onIncrease }) => (
  <div className="counter-card ornate-border-simple">
    <span className="counter-card-icon">{icon}</span>
    <span className="counter-card-name">{name}</span>
    <span className="counter-card-value">{value}</span>
    <div className="counter-card-controls">
      <button type="button" onClick={onDecrease}>
        -1
      </button>
      <button type="button" onClick={onIncrease}>
        +1
      </button>
    </div>
  </div>
);

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  allPlayers,
  onUpdate,
  onSetMonarch,
  onApplyShortcut,
  onLog,
  variant,
}) => {
  const [currentView, setCurrentView] = useState<CardView>('life');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showDeathConfirm, setShowDeathConfirm] = useState(false);
  const [playerDead, setPlayerDead] = useState(false);
  const [comboValue, setComboValue] = useState(0);
  const [comboVisible, setComboVisible] = useState(false);
  const [comboFading, setComboFading] = useState(false);
  const [shortcutLabel, setShortcutLabel] = useState('');
  const [shortcutAmountInput, setShortcutAmountInput] = useState('-1');
  const [shortcutAmount, setShortcutAmount] = useState(-1);
  const [shortcutScope, setShortcutScope] = useState<DamageShortcutScope>('others');
  const [customResourceLabel, setCustomResourceLabel] = useState('');
  const [customResourceIcon, setCustomResourceIcon] = useState(
    CUSTOM_RESOURCE_ICONS[0] || '🩸'
  );
  const deathConfirmDeclined = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const comboIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboCleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const comboActiveRef = useRef(false);
  const previousLifeRef = useRef(player.life);

  const getDefaultShortcutAmount = (scope: DamageShortcutScope) =>
    scope === 'others' ? -1 : 1;

  const setShortcutAmountProgrammatically = (value: number) => {
    setShortcutAmount(value);
    setShortcutAmountInput(String(value));
  };

  const goToNextView = () => {
    const currentIndex = viewOrder.indexOf(currentView);
    const nextIndex = (currentIndex + 1) % viewOrder.length;
    setCurrentView(viewOrder[nextIndex]);
  };

  const goToPreviousView = () => {
    const currentIndex = viewOrder.indexOf(currentView);
    const prevIndex = (currentIndex - 1 + viewOrder.length) % viewOrder.length;
    setCurrentView(viewOrder[prevIndex]);
  };

  const clearComboTimers = () => {
    if (comboIdleTimeoutRef.current) {
      clearTimeout(comboIdleTimeoutRef.current);
      comboIdleTimeoutRef.current = null;
    }
    if (comboCleanupTimeoutRef.current) {
      clearTimeout(comboCleanupTimeoutRef.current);
      comboCleanupTimeoutRef.current = null;
    }
  };

  const scheduleComboFade = () => {
    clearComboTimers();
    comboIdleTimeoutRef.current = setTimeout(() => {
      setComboFading(true);
      comboCleanupTimeoutRef.current = setTimeout(() => {
        setComboVisible(false);
        setComboFading(false);
        setComboValue(0);
        comboActiveRef.current = false;
        comboCleanupTimeoutRef.current = null;
      }, COMBO_FADE_DURATION);
      comboIdleTimeoutRef.current = null;
    }, COMBO_IDLE_DELAY);
  };

  const registerComboChange = (amount: number) => {
    const wasActive = comboActiveRef.current;
    setComboVisible(true);
    setComboFading(false);
    setComboValue(prev => (wasActive ? prev + amount : amount));
    comboActiveRef.current = true;
    scheduleComboFade();
  };

  const damageShortcuts = player.damageShortcuts ?? [];
  const customResources = player.customResources ?? [];
  const opponents = allPlayers.filter((p) => p.id !== player.id);
  const commanderCastCount = player.commanderCastCount ?? 0;
  const commanderTaxValue = commanderCastCount * 2;
  const commanderDamageValues = Object.values(player.commanderDamage || {});
  const totalCommanderDamage = commanderDamageValues.reduce((sum, dmg) => sum + dmg, 0);
  const variantStyles: CSSPropertiesWithVars | undefined = variant
    ? {
        '--player-variant-overlay': variant.overlay,
        '--player-variant-border': variant.border,
        '--player-variant-glow': variant.glow,
        '--player-variant-accent': variant.accent,
      }
    : undefined;
  const cardClassName = [
    'player-card',
    `player-color-${player.color}`,
    playerDead ? 'dead' : '',
    variant ? 'with-variant' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const innerClassName = ['player-card-inner', 'ornate-border-simple', variant ? 'with-variant' : '']
    .filter(Boolean)
    .join(' ');

  const handleApplyShortcut = (shortcut: DamageShortcut) => {
    HAPTICS.lifeChange(shortcut.amount);
    const affectsSelf = shortcut.scope !== 'others';
    if (affectsSelf) {
      registerComboChange(shortcut.amount);
    }
    onApplyShortcut(shortcut);
  };

  const handleDeleteShortcut = (shortcutId: string) => {
    const updated = damageShortcuts.filter((s) => s.id !== shortcutId);
    onUpdate({ damageShortcuts: updated });
    HAPTICS.cancel();
  };

  const handleShortcutScopeChange = (scope: DamageShortcutScope) => {
    setShortcutScope(scope);
    HAPTICS.selection();
    const baseDefault = getDefaultShortcutAmount(scope);
    if (!Number.isFinite(shortcutAmount) || shortcutAmount === 0) {
      const fallback = scope === 'all' && shortcutAmount === 0 ? -1 : baseDefault;
      setShortcutAmountProgrammatically(fallback);
      return;
    }
    if (scope === 'self' && shortcutAmount < 0) {
      setShortcutAmountProgrammatically(Math.abs(shortcutAmount));
    } else if (scope === 'others' && shortcutAmount > 0) {
      setShortcutAmountProgrammatically(-Math.abs(shortcutAmount));
    }
  };

  const handleAddShortcut = () => {
    const trimmedLabel = shortcutLabel.trim();
    if (!trimmedLabel) return;
    if (!Number.isFinite(shortcutAmount) || shortcutAmount === 0) return;

    const newShortcut: DamageShortcut = {
      id: `shortcut-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      label: trimmedLabel,
      amount: shortcutAmount,
      scope: shortcutScope,
    };

    const limit = 6;
    const updatedShortcuts = [...damageShortcuts, newShortcut];
    const boundedShortcuts =
      updatedShortcuts.length > limit
        ? updatedShortcuts.slice(updatedShortcuts.length - limit)
        : updatedShortcuts;
    onUpdate({ damageShortcuts: boundedShortcuts });
    HAPTICS.selection();
    setShortcutLabel('');
    setShortcutAmountProgrammatically(getDefaultShortcutAmount(shortcutScope));
  };

  const adjustCustomResource = (resourceId: string, amount: number) => {
    if (!amount) return;
    const resource = customResources.find((res) => res.id === resourceId);
    if (!resource) return;
    const newValue = Math.max(0, resource.value + amount);
    if (newValue === resource.value) return;
    HAPTICS.counterChange(amount);
    const updatedResources = customResources.map((res) =>
      res.id === resourceId ? { ...res, value: newValue } : res
    );
    onUpdate({ customResources: updatedResources });
    onLog({
      type: 'resource',
      message: `${player.name} ${amount > 0 ? '+' : ''}${amount} ${resource.label} (total ${newValue})`,
      playerIds: [player.id],
    });
  };

  const handleAddCustomResource = () => {
    const trimmedLabel = customResourceLabel.trim();
    if (!trimmedLabel) return;
    if (customResources.length >= 6) return;

    const icon = customResourceIcon || CUSTOM_RESOURCE_ICONS[0] || '🩸';
    const newResource: CustomResource = {
      id: `resource-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      label: trimmedLabel,
      icon,
      value: 0,
    };

    const updatedResources = [...customResources, newResource];
    onUpdate({ customResources: updatedResources });
    HAPTICS.selection();
    setCustomResourceLabel('');
    setCustomResourceIcon(CUSTOM_RESOURCE_ICONS[0] || icon);
    onLog({
      type: 'resource',
      message: `${player.name} ajoute la ressource « ${trimmedLabel} ».`,
      playerIds: [player.id],
    });
  };

  const handleDeleteCustomResource = (resourceId: string) => {
    const removed = customResources.find((res) => res.id === resourceId);
    const updatedResources = customResources.filter((res) => res.id !== resourceId);
    onUpdate({ customResources: updatedResources });
    HAPTICS.cancel();
    if (removed) {
      onLog({
        type: 'resource',
        message: `${player.name} supprime la ressource « ${removed.label} ».`,
        playerIds: [player.id],
      });
    }
  };

  const adjustCommanderCastCount = (delta: number) => {
    if (!delta) return;
    const nextCount = Math.max(0, commanderCastCount + delta);
    if (nextCount === commanderCastCount) return;
    HAPTICS.counterChange(delta);
    onUpdate({ commanderCastCount: nextCount });
    onLog({
      type: 'resource',
      message: `${player.name} ${delta > 0 ? '+' : ''}${delta} sortie${Math.abs(delta) > 1 ? 's' : ''} de commander (taxe +${nextCount * 2}).`,
      playerIds: [player.id],
    });
  };

  const resetCommanderCastCount = () => {
    if (commanderCastCount === 0) return;
    HAPTICS.cancel();
    onUpdate({ commanderCastCount: 0 });
    onLog({
      type: 'resource',
      message: `${player.name} réinitialise la taxe du commander.`,
      playerIds: [player.id],
    });
  };

  const handleResetCommanderDamageAgainst = (opponentId: string) => {
    const currentDamage = player.commanderDamage[opponentId] || 0;
    if (!currentDamage) return;
    HAPTICS.cancel();
    onUpdate({
      commanderDamage: {
        ...player.commanderDamage,
        [opponentId]: 0,
      },
    });
    const opponent = allPlayers.find((p) => p.id === opponentId);
    onLog({
      type: 'commander',
      message: `${player.name} réinitialise les dégâts commander de ${opponent ? opponent.name : 'son adversaire'}.`,
      playerIds: [player.id, opponentId],
    });
  };

  const adjustLife = (amount: number) => {
    const newLife = player.life + amount;
    const history = player.lifeHistory || [];

    // Keep last 5 life values for undo
    const newHistory = [player.life, ...history].slice(0, 5);

    HAPTICS.lifeChange(amount);

    registerComboChange(amount);

    // Reset death confirmation declined if life changes
    if (deathConfirmDeclined.current) {
      deathConfirmDeclined.current = false;
    }

    onUpdate({ life: newLife, lifeHistory: newHistory });
    onLog({
      type: 'life',
      message: `${player.name} ${amount > 0 ? '+' : ''}${amount} PV (→ ${newLife})`,
      playerIds: [player.id],
    });
  };

  const undoLife = () => {
    const history = player.lifeHistory || [];
    if (history.length > 0) {
      const previousLife = history[0];
      const newHistory = history.slice(1);

      HAPTICS.undo();

      onUpdate({ life: previousLife, lifeHistory: newHistory });
      onLog({
        type: 'life',
        message: `${player.name} annule le dernier changement (→ ${previousLife} PV)`,
        playerIds: [player.id],
      });
    }
  };

  const adjustCounter = (counter: 'poison' | 'energy' | 'experience', amount: number) => {
    const newValue = Math.max(0, player[counter] + amount);
    HAPTICS.counterChange(amount);
    onUpdate({ [counter]: newValue });
    const labels: Record<typeof counter, string> = {
      poison: 'marqueur poison',
      energy: 'énergie',
      experience: 'expérience',
    };
    onLog({
      type: 'resource',
      message: `${player.name} ${amount > 0 ? '+' : ''}${amount} ${labels[counter]} (total ${newValue})`,
      playerIds: [player.id],
    });
  };

  const adjustCustomCounter = (counter: 'treasures', amount: number) => {
    const current = player[counter] ?? 0;
    const newValue = Math.max(0, current + amount);
    if (newValue === current) return;
    HAPTICS.counterChange(amount);
    onUpdate({ [counter]: newValue });
    const label = counter === 'treasures' ? 'trésor' : counter;
    onLog({
      type: 'resource',
      message: `${player.name} ${amount > 0 ? '+' : ''}${amount} ${label}${Math.abs(amount) > 1 ? 's' : ''} (total ${newValue})`,
      playerIds: [player.id],
    });
  };

  const adjustCommanderDamage = (opponentId: string, amount: number) => {
    const currentDamage = player.commanderDamage[opponentId] || 0;
    const newDamage = Math.max(0, currentDamage + amount);
    HAPTICS.commanderDamage(amount);
    const delta = newDamage - currentDamage;
    const newLifeTotal = player.life - delta;
    onUpdate({
      commanderDamage: {
        ...player.commanderDamage,
        [opponentId]: newDamage,
      },
      life: newLifeTotal,
      lifeHistory: delta !== 0
        ? [player.life, ...(player.lifeHistory || [])].slice(0, 5)
        : player.lifeHistory,
    });
    if (delta !== 0) {
      registerComboChange(-delta);
      const opponent = allPlayers.find((p) => p.id === opponentId);
      const verb = delta > 0 ? 'subit' : 'retire';
      onLog({
        type: 'commander',
        message: `${player.name} ${verb} ${Math.abs(delta)} dégâts commander ${opponent ? `de ${opponent.name}` : ''} (total ${newDamage}, ${newLifeTotal} PV).`,
        playerIds: [player.id, opponentId],
      });
    }
  };

  const shouldBeEliminated = player.life <= 0 || player.poison >= 10 ||
    commanderDamageValues.some(dmg => dmg >= 21);

  // Check if player should be eliminated and show confirmation
  useEffect(() => {
    if (shouldBeEliminated && !playerDead && !showDeathConfirm && !deathConfirmDeclined.current) {
      setShowDeathConfirm(true);
    }
    if (!shouldBeEliminated) {
      setPlayerDead(false);
      deathConfirmDeclined.current = false;
    }
  }, [shouldBeEliminated, playerDead, showDeathConfirm]);

  useEffect(() => {
    return () => {
      clearComboTimers();
      comboActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (player.life !== previousLifeRef.current) {
      previousLifeRef.current = player.life;
      if (deathConfirmDeclined.current) {
        deathConfirmDeclined.current = false;
      }
    }
  }, [player.life]);

  const handleConfirmDeath = () => {
    HAPTICS.eliminate();
    setPlayerDead(true);
    setShowDeathConfirm(false);
    deathConfirmDeclined.current = false;
    onLog({
      type: 'info',
      message: `${player.name} est éliminé.`,
      playerIds: [player.id],
    });
  };

  const handleCancelDeath = () => {
    HAPTICS.cancel();
    setShowDeathConfirm(false);
    deathConfirmDeclined.current = true;
  };

  // Swipe handling
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextView();
    }

    if (isRightSwipe) {
      goToPreviousView();
    }
  };

  // Add mouse drag for desktop testing
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseStart, setMouseStart] = useState(0);
  const [mouseEnd, setMouseEnd] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    setMouseDown(true);
    setMouseStart(e.clientX);
    setMouseEnd(0);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (mouseDown) {
      setMouseEnd(e.clientX);
    }
  };

  const onMouseUp = () => {
    if (!mouseDown || !mouseStart || !mouseEnd) {
      setMouseDown(false);
      return;
    }

    const distance = mouseStart - mouseEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextView();
    }

    if (isRightSwipe) {
      goToPreviousView();
    }

    setMouseDown(false);
    setMouseStart(0);
    setMouseEnd(0);
  };

  const onMouseLeave = () => {
    setMouseDown(false);
  };

  const comboClassName = comboValue > 0 ? 'positive' : comboValue < 0 ? 'negative' : 'neutral';
  const comboDisplayValue = comboValue > 0 ? `+${comboValue}` : comboValue.toString();
  const isShortcutAddDisabled =
    !shortcutLabel.trim() || !Number.isFinite(shortcutAmount) || shortcutAmount === 0;
  const isCustomResourceAddDisabled =
    !customResourceLabel.trim() || customResources.length >= 6;

  return (
    <div
      className={cardClassName}
      style={variantStyles}
    >
      <div
        className={innerClassName}
        ref={cardRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Player name */}
        <div className="player-header">
          <h3 className="player-name">
            {player.name}
            {player.isMonarch && <span className="monarch-crown">👑</span>}
          </h3>
          {commanderDamageValues.some(dmg => dmg > 0) && (
            <div className="commander-chip-bar">
              {Object.entries(player.commanderDamage || {})
                .filter(([, dmg]) => dmg > 0)
                .map(([opponentId, dmg]) => {
                  const opponent = allPlayers.find((p) => p.id === opponentId);
                  if (!opponent) return null;
                  return (
                    <span
                      key={opponentId}
                      className="commander-chip"
                      style={{ borderColor: `var(--color-${opponent.color})` }}
                      title={`Dégâts de ${opponent.name}`}
                    >
                      ⚔ {dmg} ({opponent.name})
                    </span>
                  );
                })}
            </div>
          )}
          <div className="view-indicators">
            {viewOrder.map((view) => (
              <span key={view} className={`indicator ${currentView === view ? 'active' : ''}`}>
                •
              </span>
            ))}
          </div>
        </div>

        {/* Life View */}
        {currentView === 'life' && (
          <div className="view-content life-view">
            <div className="life-section-large">
              <button
                className="life-button life-decrease"
                onClick={() => adjustLife(-1)}
              >
                -
              </button>

              <div className="life-display-large">
                <div className="life-total-large">{player.life}</div>
                {(comboVisible || comboFading) && (
                  <div
                    className={`combo-display ${comboVisible ? 'show' : ''} ${comboFading ? 'fading' : ''} ${comboClassName}`}
                  >
                    {comboDisplayValue}
                  </div>
                )}
                <div className="life-label">VIE</div>
              </div>

              <button
                className="life-button life-increase"
                onClick={() => adjustLife(1)}
              >
                +
              </button>
            </div>

            {/* +5/-5 buttons */}
            <div className="life-quick-buttons">
              <button
                className="quick-life-btn decrease"
                onClick={() => adjustLife(-5)}
              >
                -5
              </button>
              <button
                className="quick-life-btn increase"
                onClick={() => adjustLife(5)}
              >
                +5
              </button>
            </div>

            {/* Undo button - always takes up space but hidden when unavailable */}
            <div className="undo-section">
              <button
                className={`undo-btn ${(player.lifeHistory && player.lifeHistory.length > 0) ? 'visible' : ''}`}
                onClick={undoLife}
                title="Annuler la dernière action"
                disabled={!player.lifeHistory || player.lifeHistory.length === 0}
              >
                ↶ Annuler
              </button>
            </div>

            {/* Quick summary of other counters */}
            <div className="quick-summary">
              {player.poison > 0 && <span className="summary-badge poison">☠ {player.poison}</span>}
              {player.energy > 0 && <span className="summary-badge energy">⚡ {player.energy}</span>}
              {player.experience > 0 && <span className="summary-badge experience">★ {player.experience}</span>}
              {commanderCastCount > 0 && (
                <span className="summary-badge commander-tax">🗡 +{commanderTaxValue}</span>
              )}
              {(player.treasures ?? 0) > 0 && (
                <span className="summary-badge treasure">🜂 {player.treasures}</span>
              )}
              {customResources
                .filter((resource) => resource.value > 0)
                .map((resource) => (
                  <span key={resource.id} className="summary-badge custom-resource">
                    {resource.icon} {resource.value}
                  </span>
                ))}
              {commanderDamageValues.some(dmg => dmg > 0) && (
                <span className="summary-badge commander">⚔ {totalCommanderDamage}</span>
              )}
            </div>
          </div>
        )}

        {/* Counters View */}
        {currentView === 'counters' && (
          <div className="view-content counters-view">
            <h4 className="view-title">Ressources</h4>
            <div className="counters-grid">
              <CounterCard
                icon="☠"
                name="Poison"
                value={player.poison}
                onDecrease={() => adjustCounter('poison', -1)}
                onIncrease={() => adjustCounter('poison', 1)}
              />
              <CounterCard
                icon="⚡"
                name="Énergie"
                value={player.energy}
                onDecrease={() => adjustCounter('energy', -1)}
                onIncrease={() => adjustCounter('energy', 1)}
              />
              <CounterCard
                icon="★"
                name="Expérience"
                value={player.experience}
                onDecrease={() => adjustCounter('experience', -1)}
                onIncrease={() => adjustCounter('experience', 1)}
              />
              <CounterCard
                icon="🜂"
                name="Trésors"
                value={player.treasures || 0}
                onDecrease={() => adjustCustomCounter('treasures', -1)}
                onIncrease={() => adjustCustomCounter('treasures', 1)}
              />
              {customResources.map((resource) => (
                <CounterCard
                  key={resource.id}
                  icon={resource.icon}
                  name={resource.label}
                  value={resource.value}
                  onDecrease={() => adjustCustomResource(resource.id, -1)}
                  onIncrease={() => adjustCustomResource(resource.id, 1)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Command Zone View */}
        {currentView === 'commandZone' && (
          <div className="view-content command-zone-view">
            <div className="command-zone-grid">
              <div className="command-zone-card ornate-border-simple">
                <h4 className="command-zone-title">Monarque</h4>
                <div className="command-zone-body">
                  <p className="command-zone-status">
                    {player.isMonarch ? 'Vous détenez la couronne.' : 'Couronne disponible.'}
                  </p>
                  <button
                    type="button"
                    className={`command-zone-action ${player.isMonarch ? 'leave' : 'claim'}`}
                    onClick={() => {
                      if (player.isMonarch) {
                        HAPTICS.cancel();
                        onSetMonarch(false);
                      } else {
                        HAPTICS.monarch();
                        onSetMonarch(true);
                      }
                    }}
                  >
                    {player.isMonarch ? 'Abandonner la couronne' : 'Devenir le Monarque'}
                  </button>
                </div>
              </div>

              <div className="command-zone-card ornate-border-simple">
                <h4 className="command-zone-title">Taxe du commander</h4>
                <div className="command-zone-body">
                  <div className="commander-tax-display">
                    <span className="tax-label">Taxe actuelle</span>
                    <span className="tax-value">+{commanderTaxValue}</span>
                    <span className="tax-sublabel">Sorties: {commanderCastCount}</span>
                  </div>
                  <div className="tax-controls">
                    <button type="button" onClick={() => adjustCommanderCastCount(-1)}>
                      −1 sortie
                    </button>
                    <button type="button" onClick={() => adjustCommanderCastCount(1)}>
                      +1 sortie
                    </button>
                  </div>
                  <button
                    type="button"
                    className="command-zone-secondary"
                    onClick={resetCommanderCastCount}
                    disabled={commanderCastCount === 0}
                  >
                    Réinitialiser la taxe
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Commander Damage View */}
        {currentView === 'commander' && (
          <div className="view-content commander-view">
            <h4 className="view-title">Dégâts Commander</h4>
            <div className="commander-grid">
              {opponents.map((opponent) => {
                const damage = player.commanderDamage[opponent.id] || 0;
                const lethal = damage >= 21;
                const remaining = Math.max(0, 21 - damage);
                return (
                  <div
                    key={opponent.id}
                    className={`commander-card ornate-border-simple ${lethal ? 'lethal' : ''}`}
                  >
                    <div className="commander-card-header">
                      <span
                        className="commander-card-icon"
                        style={{ color: `var(--color-${opponent.color})` }}
                      >
                        ⚔
                      </span>
                      <span
                        className="commander-card-name"
                        style={{ color: `var(--color-${opponent.color})` }}
                      >
                        {opponent.name}
                      </span>
                      <button
                        type="button"
                        className="commander-reset"
                        onClick={() => handleResetCommanderDamageAgainst(opponent.id)}
                        title="Réinitialiser"
                        disabled={damage === 0}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="commander-card-body">
                      <div className="commander-damage-value">{damage}</div>
                      <div className="commander-damage-meta">
                        {lethal ? 'Létal atteint !' : `${remaining} dégâts avant létal`}
                      </div>
                      <div className="commander-card-controls">
                        <button type="button" onClick={() => adjustCommanderDamage(opponent.id, -5)}>
                          -5
                        </button>
                        <button type="button" onClick={() => adjustCommanderDamage(opponent.id, -1)}>
                          -1
                        </button>
                        <button type="button" onClick={() => adjustCommanderDamage(opponent.id, 1)}>
                          +1
                        </button>
                        <button type="button" onClick={() => adjustCommanderDamage(opponent.id, 5)}>
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings View */}
        {currentView === 'settings' && (
          <div className="view-content settings-view">
            <h4 className="view-title">Paramètres</h4>
            <div className="settings-list">
              <div className="shortcut-section ornate-border-simple">
                <h5 className="shortcut-title">Raccourcis de dégâts</h5>
                {damageShortcuts.length === 0 ? (
                  <p className="shortcut-empty">Aucun raccourci encore défini.</p>
                ) : (
                  <ul className="shortcut-list">
                    {damageShortcuts.map((shortcut) => (
                      <li key={shortcut.id} className="shortcut-row">
                        <div className="shortcut-info">
                          <span className="shortcut-label">{shortcut.label}</span>
                          <span className="shortcut-meta">
                            {shortcut.amount > 0 ? '+' : ''}
                            {shortcut.amount} • {shortcutScopeLabels[shortcut.scope]}
                          </span>
                        </div>
                        <div className="shortcut-actions">
                          <button
                            type="button"
                            className="shortcut-apply"
                            onClick={() => handleApplyShortcut(shortcut)}
                          >
                            Lancer
                          </button>
                          <button
                            type="button"
                            className="shortcut-delete"
                            onClick={() => handleDeleteShortcut(shortcut.id)}
                            title="Supprimer"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="shortcut-form">
                  <div className="shortcut-form-row">
                    <input
                      type="text"
                      value={shortcutLabel}
                      onChange={(e) => setShortcutLabel(e.target.value)}
                      placeholder="Nom du raccourci"
                      maxLength={20}
                    />
                  </div>
                  <div className="shortcut-form-grid">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={shortcutAmountInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setShortcutAmountInput(value);
                        const trimmed = value.trim();
                        if (trimmed === '' || trimmed === '-' || trimmed === '+') {
                          setShortcutAmount(NaN);
                          return;
                        }
                        const parsed = Number(trimmed);
                        if (Number.isNaN(parsed)) {
                          setShortcutAmount(NaN);
                          return;
                        }
                        setShortcutAmount(Math.trunc(parsed));
                      }}
                      onBlur={() => {
                        if (!Number.isFinite(shortcutAmount) || shortcutAmount === 0) {
                          setShortcutAmountProgrammatically(getDefaultShortcutAmount(shortcutScope));
                          return;
                        }
                        setShortcutAmountProgrammatically(shortcutAmount);
                      }}
                      placeholder="Valeur"
                      step={1}
                    />
                    <select
                      value={shortcutScope}
                      onChange={(e) =>
                        handleShortcutScopeChange(e.target.value as DamageShortcutScope)
                      }
                    >
                      <option value="all">Tous</option>
                      <option value="others">Adversaires</option>
                      <option value="self">Moi</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="shortcut-add"
                    onClick={handleAddShortcut}
                    disabled={isShortcutAddDisabled}
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              <div className="custom-resources-section ornate-border-simple">
                <h5 className="custom-resources-title">Ressources personnalisées</h5>
                {customResources.length === 0 ? (
                  <p className="custom-resources-empty">Aucune ressource ajoutée.</p>
                ) : (
                  <ul className="custom-resources-list">
                    {customResources.map((resource) => (
                      <li key={resource.id} className="custom-resource-row">
                        <span className="custom-resource-icon">{resource.icon}</span>
                        <span className="custom-resource-label">{resource.label}</span>
                        <span className="custom-resource-value">{resource.value}</span>
                        <button
                          type="button"
                          className="custom-resource-delete"
                          onClick={() => handleDeleteCustomResource(resource.id)}
                          title="Supprimer"
                          aria-label={`Supprimer ${resource.label}`}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="custom-resource-form">
                  <input
                    type="text"
                    value={customResourceLabel}
                    onChange={(e) => setCustomResourceLabel(e.target.value)}
                    placeholder="Nom de la ressource"
                    maxLength={16}
                    title="Nom de la ressource"
                  />
                  <select
                    value={customResourceIcon}
                    onChange={(e) => setCustomResourceIcon(e.target.value)}
                    title="Icône"
                  >
                    {CUSTOM_RESOURCE_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="custom-resource-add"
                    onClick={handleAddCustomResource}
                    disabled={isCustomResourceAddDisabled}
                    title="Ajouter une ressource personnalisée"
                  >
                    Ajouter
                  </button>
                </div>
                {customResources.length >= 6 && (
                  <p className="custom-resource-limit">Limite de 6 ressources atteinte.</p>
                )}
              </div>

              <button
                className="settings-btn kill-btn"
                onClick={() => {
                  HAPTICS.eliminate();
                  setPlayerDead(true);
                  setShowDeathConfirm(false);
                  onLog({
                    type: 'info',
                    message: `${player.name} est marqué comme éliminé.`,
                    playerIds: [player.id],
                  });
                }}
              >
                💀 Éliminer le joueur
              </button>

              {playerDead && (
                <button
                  className="settings-btn revive-btn"
                  onClick={() => {
                    HAPTICS.revive();
                    setPlayerDead(false);
                    onLog({
                      type: 'info',
                      message: `${player.name} est ressuscité.`,
                      playerIds: [player.id],
                    });
                  }}
                >
                  ✨ Ressusciter le joueur
                </button>
              )}
            </div>
          </div>
        )}

        {/* Death confirmation overlay */}
        {showDeathConfirm && (
          <div className="death-confirm-overlay">
            <div className="death-confirm-box ornate-border-simple">
              <h4 className="death-confirm-title">⚠️ Élimination ?</h4>
              <p className="death-confirm-text">
                {player.life <= 0 && "Points de vie à 0"}
                {player.poison >= 10 && "10 marqueurs poison"}
                {Object.values(player.commanderDamage).some(dmg => dmg >= 21) && "21 dégâts commander"}
              </p>
              <p className="death-confirm-subtitle">
                Le joueur est-il éliminé ?
              </p>
              <div className="death-confirm-buttons">
                <button className="death-confirm-yes" onClick={handleConfirmDeath}>
                  Oui
                </button>
                <button className="death-confirm-no" onClick={handleCancelDeath}>
                  Non
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Death overlay when confirmed */}
        {playerDead && (
          <div className="death-overlay">
            <div className="death-text">💀 ÉLIMINÉ 💀</div>
          </div>
        )}
      </div>
    </div>
  );
};
