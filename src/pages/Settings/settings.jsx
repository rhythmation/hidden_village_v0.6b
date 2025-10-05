import React, { useState } from "react";
import { Link } from "react-router-dom";

function SettingsMenu() {
  const [settings, setSettings] = useState({
    sound: true,
    music: true,
    story: true,
    mClips: true,
    tween: true,
    repetitions: true,
    calibration: true,
    hints: true,
    audioRecording: false,
    noOfHints: 3,
    fps: 60, 
    language: "English",
  });

  const toLabel = (s) =>
    s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

  const pillStyle = (on) => ({
    border: "1px solid #e5e7eb",
    background: on ? "#4f46e5" : "#f3f4f6",
    color: on ? "#fff" : "#111827",
    borderRadius: "9999px",
    padding: "6px 12px",
    fontWeight: 600,
    minWidth: 64,
    textAlign: "center",
    cursor: "pointer",
  });

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    border: "1px solid #eee",
    borderRadius: 12,
    background: "#fff",
  };

  const inputStyle = {
    padding: "8px 10px",
    border: "1px solid #d0d7de",
    borderRadius: 8,
    font: "inherit",
  };

  const handleToggle = (settingKey) => {
    setSettings((prev) => ({
      ...prev,
      [settingKey]: !prev[settingKey],
    }));
  };

  const handleChange = (settingKey, value) => {
    setSettings((prev) => ({
      ...prev,
      [settingKey]: value,
    }));
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 28px" }}>
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Settings</h1>
      <p style={{ margin: "6px 0 16px", color: "#555" }}>
        Fine-tune your experience.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {Object.keys(settings).map((key) => {
          const value = settings[key];
          const label = toLabel(key);

          if (typeof value === "boolean") {
            return (
              <div key={key} style={rowStyle}>
                <span>{label}</span>
                <button
                  onClick={() => handleToggle(key)}
                  style={pillStyle(Boolean(value))}
                >
                  {value ? "On" : "Off"}
                </button>
              </div>
            );
          }

          if (key === "noOfHints" || key === "fps") {
            return (
              <div key={key} style={rowStyle}>
                <span>{label}</span>
                <input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    handleChange(key, parseInt(e.target.value || "0", 10))
                  }
                  style={inputStyle}
                />
              </div>
            );
          }

          if (key === "language") {
            return (
              <div key={key} style={rowStyle}>
                <span>{label}</span>
                <select
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={inputStyle}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  {/* Add more languages if needed */}
                </select>
              </div>
            );
          }

          return null;
        })}
      </div>

      <p style={{ marginTop: 24 }}>
        <Link to="/">Back to Home</Link>
      </p>
    </div>
  );
}

export default SettingsMenu;
