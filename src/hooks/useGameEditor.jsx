import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  writeGame,
  getGameById,
  getLevelList,
  deleteGameById,
} from '../services/gameStore';

export const useGameEditor = (gameId, isNew, userEmail) => {
  const navigate = useNavigate();

  // Game state
  const [game, setGame] = useState({
    id: null,
    name: '',
    author: userEmail ?? '',
    description: '',
    keywords: '',
    pin: '',
    levelIds: [],
    storyline: [],
    settings: {},
  });

  // UI state
  const [loadingGame, setLoadingGame] = useState(true);
  const [savingGame, setSavingGame] = useState(false);
  const [allAvailableLevels, setAllAvailableLevels] = useState({});
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [showAddLevel, setShowAddLevel] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadAvailableLevels();

    if (isNew) {
      setLoadingGame(false);
      return;
    }

    if (gameId) {
      loadGame(gameId);
    }
  }, [gameId, isNew]);

  const loadAvailableLevels = async () => {
    try {
      const res = await getLevelList();
      if (res.success && res.data) {
        setAllAvailableLevels(res.data);
      }
    } catch (err) {
      console.error('Error loading levels:', err);
    }
  };

  const loadGame = async (id) => {
    setLoadingGame(true);
    try {
      const res = await getGameById(id);
      if (!res.success) {
        alert('Failed to load game.');
        setLoadingGame(false);
        return;
      }

      const g = res.data ?? {};
      setGame({
        ...g,
        id: id,
        levelIds: Array.isArray(g.levelIds) ? g.levelIds : [],
        storyline: Array.isArray(g.storyline) ? g.storyline : [],
      });
    } catch (err) {
      alert('Unexpected error loading game.');
    } finally {
      setLoadingGame(false);
    }
  };

  const startEditing = useCallback((field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  }, []);

  const saveEdit = useCallback(() => {
    if (editingField) {
      setGame((prev) => ({ ...prev, [editingField]: editValue }));
      setEditingField(null);
      setEditValue('');
    }
  }, [editingField, editValue]);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  const addLevel = useCallback((levelId) => {
    if (game.levelIds.includes(levelId)) {
      alert('Level already added!');
      return;
    }

    setGame((prev) => ({
      ...prev,
      levelIds: [...prev.levelIds, levelId],
    }));
    setShowAddLevel(false);
  }, [game.levelIds]);

  const removeLevel = useCallback((index) => {
    if (!window.confirm('Remove this level from the game?')) return;

    setGame((prev) => {
      const newLevelIds = [...prev.levelIds];
      const newStoryline = [...prev.storyline];
      
      newLevelIds.splice(index, 1);
      newStoryline.splice(index, 1);
      
      return {
        ...prev,
        levelIds: newLevelIds,
        storyline: newStoryline,
      };
    });
  }, []);

  const moveLevel = useCallback((index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= game.levelIds.length) return;

    setGame((prev) => {
      const newLevelIds = [...prev.levelIds];
      const newStoryline = [...prev.storyline];

      [newLevelIds[index], newLevelIds[newIndex]] = [newLevelIds[newIndex], newLevelIds[index]];
      
      if (newStoryline[index] || newStoryline[newIndex]) {
        [newStoryline[index], newStoryline[newIndex]] = [newStoryline[newIndex], newStoryline[index]];
      }

      return {
        ...prev,
        levelIds: newLevelIds,
        storyline: newStoryline,
      };
    });
  }, [game.levelIds]);

  const toggleExpandLevel = useCallback((levelId) => {
    setExpandedLevel((prev) => (prev === levelId ? null : levelId));
  }, []);

  const getLevelData = useCallback((levelId) => {
    return allAvailableLevels[levelId] || { name: '(loading…)' };
  }, [allAvailableLevels]);

  const handleSave = useCallback(async (isPublish = false) => {
    setSavingGame(true);

    try {
      const res = await writeGame({
        id: game.id,
        author: game.author,
        name: game.name,
        keywords: game.keywords,
        isPublished: isPublish,
        levelIds: game.levelIds,
        settings: game.settings,
        pin: game.pin,
        storyline: game.storyline,
        description: game.description,
      });

      if (!res.success) {
        alert(res.message || 'Failed to save game.');
        return;
      }

      if (isNew && res.data?.gameId) {
        setGame((prev) => ({ ...prev, id: res.data.gameId }));
        alert(isPublish ? 'Game created and published!' : 'Game created as draft!');
        if (isPublish) {
          navigate('/game/edit', { replace: true });
        }
        return;
      }

      alert(isPublish ? 'Game published!' : 'Draft saved!');
      if (isPublish) {
        navigate('/game/edit', { replace: true });
      }
    } catch (err) {
      alert('Unexpected error saving game.');
    } finally {
      setSavingGame(false);
    }
  }, [game, isNew, navigate]);

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Delete this game?')) return;

    const res = await deleteGameById(game.id);
    if (res.success) {
      alert('Game deleted.');
      navigate('/game/edit', { replace: true });
    } else {
      alert('Failed to delete game.');
    }
  }, [game.id, navigate]);

  const handleBack = useCallback(() => {
    navigate('/game/edit');
  }, [navigate]);

  return {
    // Game data
    game,
    loadingGame,
    savingGame,
    allAvailableLevels,
    
    // UI state
    expandedLevel,
    showAddLevel,
    setShowAddLevel,
    
    // Editing state
    editingField,
    editValue,
    setEditValue,
    startEditing,
    saveEdit,
    cancelEdit,
    
    // Level operations
    addLevel,
    removeLevel,
    moveLevel,
    toggleExpandLevel,
    getLevelData,
    
    // Save/Delete/Navigate
    handleSave,
    handleDelete,
    handleBack,
  };
};