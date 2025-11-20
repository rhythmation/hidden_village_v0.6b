// src/pages/GameEditor/GameEditor.jsx
import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MoveUp, MoveDown, Trash2, Edit2, Plus, Check, X, ArrowLeft, BookOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGameEditor } from '../../hooks/useGameEditor';
import './GameEditor.css';

function GameEditor({ isNew = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const editRef = useRef(null);

  const {
    game,
    loadingGame,
    savingGame,
    allAvailableLevels,
    expandedLevel,
    showAddLevel,
    setShowAddLevel,
    editingField,
    editValue,
    setEditValue,
    startEditing,
    saveEdit,
    cancelEdit,
    addLevel,
    removeLevel,
    moveLevel,
    toggleExpandLevel,
    getLevelData,
    handleSave,
    handleDelete,
    handleBack,
  } = useGameEditor(id, isNew, user?.email);

  const handleKeyDown = (e, isTextarea = false) => {
    if (isTextarea) {
      if (e.key === 'Enter' && e.ctrlKey) saveEdit();
      if (e.key === 'Escape') saveEdit();
    } else {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') saveEdit();
    }
  };

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editRef.current && !editRef.current.contains(event.target)) {
        saveEdit();
      }
    };

    if (editingField) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingField, saveEdit]);

  // Loading state
  if (loadingGame) {
    return <p className="game-editor-loading">Loading game...</p>;
  }

  if (!game) {
    return <p className="game-editor-error">Game not found.</p>;
  }

  return (
    <div className="game-editor">
      {/* HEADER */}
      <div className="game-editor-header">
        <button className="game-editor-back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          Back to Games
        </button>
        <h2 className="game-editor-title">
          {isNew ? 'Create New Game' : 'Editing Game'}
        </h2>
        <div className="game-editor-spacer"></div>
      </div>

      {/* GAME INFO */}
      <div className="game-editor-info">
        {/* Name */}
        <div className="game-editor-row">
          <label>Name</label>
          <div className="game-editor-value">
            {editingField === 'name' ? (
              <div ref={editRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="game-editor-input-edit"
                />
                <Check className="game-editor-icon-save" onClick={saveEdit} />
                <X className="game-editor-icon-cancel" onClick={cancelEdit} />
              </div>
            ) : (
              <>
                <span onDoubleClick={() => startEditing('name', game.name)}>
                  {game.name || 'Click to edit'}
                </span>
                <Edit2 className="game-editor-icon-edit" onClick={() => startEditing('name', game.name)} />
              </>
            )}
          </div>
        </div>

        {/* Author */}
        <div className="game-editor-row">
          <label>Author</label>
          <div className="game-editor-value">
            <span className="game-editor-readonly">{game.author}</span>
          </div>
        </div>

        {/* Description */}
        <div className="game-editor-row">
          <label>Description</label>
          <div className="game-editor-value">
            {editingField === 'description' ? (
              <div ref={editRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, true)}
                  autoFocus
                  className="game-editor-textarea-edit"
                />
                <Check className="game-editor-icon-save" onClick={saveEdit} />
                <X className="game-editor-icon-cancel" onClick={cancelEdit} />
              </div>
            ) : (
              <>
                <span onDoubleClick={() => startEditing('description', game.description)}>
                  {game.description || 'Click to edit'}
                </span>
                <Edit2 className="game-editor-icon-edit" onClick={() => startEditing('description', game.description)} />
              </>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="game-editor-row">
          <label>Keywords</label>
          <div className="game-editor-value">
            {editingField === 'keywords' ? (
              <div ref={editRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="game-editor-input-edit"
                />
                <Check className="game-editor-icon-save" onClick={saveEdit} />
                <X className="game-editor-icon-cancel" onClick={cancelEdit} />
              </div>
            ) : (
              <>
                <span onDoubleClick={() => startEditing('keywords', game.keywords)}>
                  {game.keywords || 'Click to edit'}
                </span>
                <Edit2 className="game-editor-icon-edit" onClick={() => startEditing('keywords', game.keywords)} />
              </>
            )}
          </div>
        </div>

        {/* PIN */}
        <div className="game-editor-row">
          <label>PIN</label>
          <div className="game-editor-value">
            {editingField === 'pin' ? (
              <div ref={editRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="game-editor-input-edit"
                />
                <Check className="game-editor-icon-save" onClick={saveEdit} />
                <X className="game-editor-icon-cancel" onClick={cancelEdit} />
              </div>
            ) : (
              <>
                <span onDoubleClick={() => startEditing('pin', game.pin)}>
                  {game.pin || 'Click to edit'}
                </span>
                <Edit2 className="game-editor-icon-edit" onClick={() => startEditing('pin', game.pin)} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* LEVELS SECTION */}
      <div className="game-editor-levels-header">
        <h3 className="game-editor-subtitle">Levels</h3>
        <div className="game-editor-levels-actions">
          <button className="game-editor-storyline-btn" onClick={() => alert('Storyline editor coming soon!')}>
            <BookOpen size={18} /> Edit Storyline
          </button>
          <button className="game-editor-add-level-btn" onClick={() => setShowAddLevel(!showAddLevel)}>
            <Plus size={18} /> Add Level
          </button>
        </div>
      </div>

      {/* Add Level Dropdown */}
      {showAddLevel && (
        <div className="game-editor-add-level">
          <p>Select a level to add:</p>
          <div className="game-editor-level-options">
            {Object.entries(allAvailableLevels).map(([levelId, levelData]) => (
              <div
                key={levelId}
                className={`game-editor-level-option ${game.levelIds.includes(levelId) ? 'disabled' : ''}`}
                onClick={() => !game.levelIds.includes(levelId) && addLevel(levelId)}
              >
                <span>{levelData.name || 'Untitled Level'}</span>
                {game.levelIds.includes(levelId) && <span className="added-tag">✓ Added</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level List */}
      <div className="game-editor-levels">
        {game.levelIds.length === 0 ? (
          <p className="game-editor-no-levels">No levels added yet. Click "Add Level" to get started.</p>
        ) : (
          game.levelIds.map((levelId, index) => {
            const levelData = getLevelData(levelId);
            return (
              <div key={levelId} className="game-editor-level">
                <div
                  className="game-editor-level-header"
                  onClick={() => toggleExpandLevel(levelId)}
                >
                  <span>
                    {levelData.name || 'Untitled Level'}
                    {game.storyline[index]?.length > 0 && (
                      <span className="storyline-indicator">
                        {' '}
                        📖 {game.storyline[index].length} dialogue{game.storyline[index].length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </span>

                  <div className="game-editor-level-actions">
                    <MoveUp
                      size={20}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLevel(index, -1);
                      }}
                      style={{ opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                    />
                    <MoveDown
                      size={20}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLevel(index, 1);
                      }}
                      style={{
                        opacity: index === game.levelIds.length - 1 ? 0.3 : 1,
                        cursor: index === game.levelIds.length - 1 ? 'not-allowed' : 'pointer',
                      }}
                    />
                    <Trash2
                      size={20}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLevel(index);
                      }}
                    />
                  </div>
                </div>

                {expandedLevel === levelId && (
                  <div className="game-editor-level-body">
                    <pre>{JSON.stringify(levelData, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="game-editor-actions">
        <button className="game-editor-btn" onClick={() => handleSave(false)} disabled={savingGame}>
          💾 {savingGame ? 'Saving...' : 'Save Draft'}
        </button>
        <button className="game-editor-btn game-editor-btn-publish" onClick={() => handleSave(true)} disabled={savingGame}>
          🚀 {savingGame ? 'Publishing...' : 'Publish'}
        </button>

        {!isNew && (
          <button className="game-editor-btn game-editor-btn-danger" onClick={handleDelete} disabled={savingGame}>
            🗑 Delete Game
          </button>
        )}
      </div>
    </div>
  );
}

export default GameEditor;