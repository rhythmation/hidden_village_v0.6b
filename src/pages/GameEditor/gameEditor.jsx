// -------------------------------------------
// GameEditor.jsx (Fixed + Redirect to Home)
// -------------------------------------------
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MoveUp, MoveDown, Trash2 } from "lucide-react";
import {
  writeGame,
  getGameById,
  getLevelById,
  deleteGameById,
} from "../../services/gameStore";
import { useAuth } from "../../contexts/AuthContext";

import "./GameEditor.css";

function GameEditor({ isNew = false }) {
  // We ONLY read params if editing
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [game, setGame] = useState({
    id: null,
    name: "",
    author: user.email ?? "",
    description: "",
    keywords: "",
    pin: "",
    levelIds: [],
    settings: {},
  });

  const [loadingGame, setLoadingGame] = useState(true);
  const [levelOrder, setLevelOrder] = useState([]);
  const [levels, setLevels] = useState([]);
  const [expandedLevel, setExpandedLevel] = useState(null);

  // -----------------------------
  // LOAD GAME ON EDIT ROUTE
  // -----------------------------
  useEffect(() => {
    if (isNew) {
      // NEW GAME MODE
      setLoadingGame(false);
      setGame((prev) => ({ ...prev, id: null }));
      setLevelOrder([]);
      setLevels([]);
      return;
    }

    // EDIT MODE
    if (id) loadGame(id);
  }, [id, isNew]);

  async function loadGame(gameId) {
    setLoadingGame(true);
    try {
      const res = await getGameById(gameId);
      if (!res.success) {
        alert("Failed to load game.");
        return setLoadingGame(false);
      }

      const g = res.data ?? {};

      // Normalize level IDs
      const levelIds = Array.isArray(g.levelIds)
        ? g.levelIds
        : [];

      setGame({ ...g, id: gameId });
      setLevelOrder(levelIds);

      // Create loading placeholders
      setLevels(
        levelIds.map((id) => ({ id, data: null, loading: true }))
      );

      // Load each level async
      levelIds.forEach(async (levelId) => {
        try {
          const lvlRes = await getLevelById(levelId);
          setLevels((prev) =>
            prev.map((lvl) =>
              lvl.id === levelId
                ? {
                    ...lvl,
                    data: lvlRes.success ? lvlRes.data : { name: "(Failed to load)" },
                    loading: false,
                  }
                : lvl
            )
          );
        } catch {
          setLevels((prev) =>
            prev.map((lvl) =>
              lvl.id === levelId
                ? {
                    ...lvl,
                    data: { name: "(Failed to load)" },
                    loading: false,
                  }
                : lvl
            )
          );
        }
      });
    } catch (err) {
      alert("Unexpected error loading game.");
    } finally {
      setLoadingGame(false);
    }
  }

  // -----------------------------
  // UPDATE FIELD
  // -----------------------------
  const updateField = (field, value) => {
    setGame((prev) => ({ ...prev, [field]: value }));
  };

  // -----------------------------
  // REORDER LEVELS
  // -----------------------------
  const moveLevel = (index, dir) => {
    const newOrder = [...levelOrder];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    [newOrder[index], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[index],
    ];
    setLevelOrder(newOrder);
  };

  // -----------------------------
  // SAVE GAME (DRAFT/PUBLISH)
  // -----------------------------
  async function handleSave(isPublish = false) {
  const res = await writeGame(
    game.id ?? null,
    game.author ?? null,
    game.name ?? null,
    game.keywords ?? null,
    isPublish,
    levelOrder ?? [],
    game.settings ?? {},
    game.pin ?? null
  );

  if (!res.success) {
    alert(res.message || "Failed to save game.");
    return;
  }

  // NEW GAME → home
  if (isNew && res.data?.gameId) {
    alert("Game created!");
    return navigate("/", { replace: true });
  }

  // EXISTING GAME → also home
  alert(isPublish ? "Game published!" : "Draft saved!");
  navigate("/", { replace: true });
}

  // -----------------------------
  // DELETE GAME
  // -----------------------------
  async function handleDelete() {
    if (!window.confirm("Delete this game?")) return;

    const res = await deleteGameById(game.id);
    if (res.success) {
      alert("Game deleted.");
      return navigate("/", { replace: true }); // redirect home
    }

    alert("Failed to delete game.");
  }

  // -----------------------------
  // RENDER
  // -----------------------------
  if (loadingGame) return <p>Loading game...</p>;
  if (!game) return <p>Game not found.</p>;

  return (
    <div className="editor-container">
      <h2>{isNew ? "Create New Game" : `Editing: ${game.name}`}</h2>

      {/* GAME INFO */}
      <div className="editor-section">
        <label>Name</label>
        <input
          value={game.name}
          placeholder="Enter game name"
          onChange={(e) => updateField("name", e.target.value)}
        />

        <label>Author</label>
        <input value={game.author ?? ""} disabled />

        <label>Description</label>
        <textarea
          value={game.description}
          placeholder="Game description"
          onChange={(e) => updateField("description", e.target.value)}
        />

        <label>Keywords</label>
        <input
          value={game.keywords}
          placeholder="Comma separated keywords"
          onChange={(e) => updateField("keywords", e.target.value)}
        />

        <label>PIN</label>
        <input
          value={game.pin}
          placeholder="Enter PIN"
          onChange={(e) => updateField("pin", e.target.value)}
        />
      </div>

      {/* LEVEL LIST */}
      <h3>Levels</h3>
      <div className="level-list">
        {levels.map((lvl, index) => (
          <div key={lvl.id} className="level-item">
            <div
              className="level-header"
              onClick={() =>
                setExpandedLevel(expandedLevel === lvl.id ? null : lvl.id)
              }
            >
              <span>{lvl.data?.name ?? "(loading…)"}</span>

              <div className="level-actions">
                <MoveUp onClick={() => moveLevel(index, -1)} />
                <MoveDown onClick={() => moveLevel(index, 1)} />
                <Trash2 />
              </div>
            </div>

            {expandedLevel === lvl.id && (
              <div className="level-body">
                {lvl.loading ? (
                  <p>Loading level…</p>
                ) : (
                  <pre>{JSON.stringify(lvl.data, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* BUTTONS */}
      <div className="editor-actions">
        <button onClick={() => handleSave(false)}>💾 Save Draft</button>
        <button onClick={() => handleSave(true)}>🚀 Publish</button>

        {!isNew && (
          <button className="danger" onClick={handleDelete}>
            🗑 Delete Game
          </button>
        )}
      </div>
    </div>
  );
}

export default GameEditor;
