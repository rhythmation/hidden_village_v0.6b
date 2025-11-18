import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameMenu.css";
import { getGamesList } from "../../services/gameStore";

function GameMenu({ mode }) {
  const navigate = useNavigate();

  const playMode = mode === "play";
  const editMode = mode === "edit";

  const [games, setGames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  // -----------------------------------------------------
  // FETCH GAMES
  // -----------------------------------------------------
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await getGamesList();

        if (!res.success || !res.data) {
          setGames({});
          return;
        }

        // play = only published
        // edit = all games
        let filtered;
        if (playMode) {
          filtered = Object.fromEntries(
            Object.entries(res.data).filter(([_, g]) => g.isPublished)
          );
        } else {
          filtered = res.data;
        }

        setGames(filtered);
      } catch (err) {
        console.error("Error fetching games:", err);
        setError("Failed to load games.");
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [playMode, editMode]);

  // -----------------------------------------------------
  // SEARCH FILTERING
  // -----------------------------------------------------
  const filteredGames = Object.entries(games).filter(([id, g]) => {
    try {
      const reg = new RegExp(search, "i");
      return (
        reg.test(g.name || "") ||
        reg.test(g.author || "") ||
        reg.test((g.keywords || []).join(" "))
      );
    } catch {
      return true;
    }
  });

  // -----------------------------------------------------
  // CLICK GAME → NAVIGATE TO ROUTE
  // -----------------------------------------------------
  const handleSelectGame = (id) => {
    if (playMode) navigate(`/play/${id}`);
    if (editMode) navigate(`/edit/${id}`);
  };

  // -----------------------------------------------------
  // RENDER
  // -----------------------------------------------------
  if (loading) return <p className="status-msg">Loading games...</p>;
  if (error) return <p className="error-msg">⚠️ {error}</p>;

  return (
    <div className="game-menu">
      <h2 className="menu-title">
        {playMode ? "🎮 Play Published Games" : "🛠 Edit Your Games"}
      </h2>

      <input
        placeholder="Search by name, author, or keyword"
        className="game-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="game-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Author</th>
            <th>Keywords</th>
            {!playMode && <th>Status</th>}
          </tr>
        </thead>
        <tbody>
          {filteredGames.map(([id, game]) => (
            <tr
              key={id}
              className="game-row"
              onClick={() => handleSelectGame(id)}
            >
              <td>{game.name || "Untitled Game"}</td>
              <td>{game.author || "Unknown"}</td>
              <td>
                {Array.isArray(game.keywords)
                  ? game.keywords.join(", ")
                  : game.keywords || "None"}
              </td>

              {!playMode && (
                <td style={{ color: game.isPublished ? "#3fa33f" : "#f28b30" }}>
                  {game.isPublished ? "Published" : "Unpublished"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {filteredGames.length === 0 && (
        <p className="status-msg">No games match your search.</p>
      )}
    </div>
  );
}

export default GameMenu;
