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

  // fetch games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await getGamesList();
        if (!res.success || !res.data) {
          setGames({});
          return;
        }

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

  // search box logic
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

  // click game → navigate to that game
  const handleSelectGame = (id) => {
    if (playMode) navigate(`/game/play/${id}`);
    if (editMode) navigate(`/game/edit/${id}`);
  };

  // render UI
  if (loading) return <p className="status-msg">Loading games...</p>;
  if (error) return <p className="error-msg">⚠️ {error}</p>;

  return (
    <div className="section">
      <h2 className="title">{playMode ? "Play" : "Edit"}</h2>

      <input
        placeholder="Search by name, author, or keyword"
        className="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {Object.keys(games).length > 0 ? (
        filteredGames.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Author</th>
                  <th>Keywords</th>
                  <th>Published</th>
                </tr>
              </thead>
              <tbody>
                {filteredGames.map(([id, game]) => (
                  <tr key={id} onClick={() => handleSelectGame(id)}>
                    <td className="ellipsis">{game.name || "Untitled Game"}</td>
                    <td className="ellipsis">{game.author || "Unknown"}</td>
                    <td className="ellipsis">
                      {Array.isArray(game.keywords)
                        ? game.keywords.join(", ")
                        : game.keywords || "None"}
                    </td>
                    <td
                      className="ellipsis"
                      style={{ color: game.isPublished ? "#3fa33f" : "#f28b30" }}
                    >
                      {playMode ? "" : game.isPublished ? "✅" : "❌"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-game">No games match your search</p>
        )
      ) : (
        <p className="no-game">
          {playMode ? "No published games available" : "No games found"}
        </p>
      )}
    </div>
  );
}

export default GameMenu;
