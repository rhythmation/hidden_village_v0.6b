import React, { useEffect, useState } from "react";
import { getGamesList } from "../../services/gameStore";

import "./GameMenu.css";

function GameMenu() {
  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await getGamesList();
        if (!res.success || !res.data) {
          setGames({});
        } else {
          const published = Object.fromEntries(
            Object.entries(res.data).filter(([_, g]) => g.isPublished === true)
          );
          setGames(published);
        }
      } catch (err) {
        console.error("Error fetching games:", err);
        setError("Failed to load games.");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // ---------------------------------------------------------------------------------
  // ----------------------------- UI TO BE MODIFIED ---------------------------------
  // ---------------------------------------------------------------------------------
  if (loading) return <p className="status-msg">Loading games...</p>;
  if (error) return <p className="error-msg">⚠️ {error}</p>;

  if (selectedGameId) {
    return (
      <div className="game-player-view">
        <button className="back-btn" onClick={() => setSelectedGameId(null)}>
          ← Back to Games
        </button>
        
      </div>
    );
  }

  if (!games || Object.keys(games).length === 0)
    return <p className="status-msg">No published games found.</p>;

  return (
    <div className="game-menu">
      <h2 className="menu-title">🎮 Published Games</h2>
      <ul className="game-list">
        {Object.entries(games).map(([gameId, game]) => (
          <li
            key={gameId}
            className="game-card"
            onClick={() => setSelectedGameId(gameId)}
          >
            <h3 className="game-name">{game.name || "Untitled Game"}</h3>
            <p className="game-author">
              <strong>Author:</strong> {game.author || "Unknown"}
            </p>
            <p className="game-keywords">
              <strong>Keywords:</strong>{" "}
              {Array.isArray(game.keywords)
                ? game.keywords.join(", ")
                : game.keywords || "None"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GameMenu;
