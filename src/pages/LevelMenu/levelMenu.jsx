import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LevelMenu.css";
import { getLevelList } from "../../services/gameStore";

function LevelMenu({ mode }) {
  const navigate = useNavigate();

  const playMode = mode === "play";
  const editMode = mode === "edit";

  const [levels, setLevels] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  // fetch levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await getLevelList();

        if (!res.success || !res.data) {
          setLevels({});
          return;
        }

        // play = only published
        // edit = all levels
        let filtered;
        if (playMode) {
          filtered = Object.fromEntries(
            Object.entries(res.data).filter(([_, lvl]) => lvl.isPublished)
          );
        } else {
          filtered = res.data;
        }

        setLevels(filtered);
      } catch (err) {
        console.error("Error fetching levels:", err);
        setError("Failed to load levels.");
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [playMode, editMode]);

  // search box logic
  const filteredLevels = Object.entries(levels).filter(([id, lvl]) => {
    if (!search.trim()) return true;

    const s = search.toLowerCase();

    const name = (lvl.name || "").toLowerCase();
    const author = (lvl.author || "").toLowerCase();

    const keywords = Array.isArray(lvl.keywords)
      ? lvl.keywords.join(" ").toLowerCase()
      : (lvl.keywords || "").toLowerCase();

    return (
      name.includes(s) ||
      author.includes(s) ||
      keywords.includes(s)
    );
  });

  // click level → navigate
  const handleSelectLevel = (id) => {
    if (playMode) navigate(`/level/play/${id}`);
    if (editMode) navigate(`/level/edit/${id}`);
  };

  // render UI
  if (loading) return <p className="status-msg">Loading levels...</p>;
  if (error) return <p className="error-msg">⚠️ {error}</p>;

  return (
    <div className="section">
      <h2 className="title">{playMode ? "Play Levels" : "Edit Levels"}</h2>

      <input
        placeholder="Search by name, author, or keyword"
        className="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {Object.keys(levels).length > 0 ? (
        filteredLevels.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Author</th>
                  <th>Keywords</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLevels.map(([id, lvl]) => (
                  <tr key={id} onClick={() => handleSelectLevel(id)}>
                    <td className="ellipsis">{lvl.name || "Untitled Level"}</td>
                    <td className="ellipsis">{lvl.author || "Unknown"}</td>
                    <td className="ellipsis">
                      {Array.isArray(lvl.keywords)
                        ? lvl.keywords.join(", ")
                        : lvl.keywords || "None"}
                    </td>
                    <td style={{ color: lvl.isPublished ? "#3fa33f" : "#f28b30" }}>
                      {playMode ? "" : (lvl.isPublished ? "✅" : "❌")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-game">No levels match your search</p>
        )
      ) : (
        <p className="no-game">
          {playMode ? "No published levels available" : "No levels found"}
        </p>
      )}
    </div>
  );
}

export default LevelMenu;
