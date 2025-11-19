import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { writeLevel, getLevelById } from "../../services/gameStore";
import { useAuth } from "../../contexts/AuthContext";
import "./LevelEditor.css";

export default function LevelEditor({ isNew}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  // Level fields
  const [author, setAuthor] = useState(user.email || "");
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [poses, setPoses] = useState({});
  const [description, setDescription] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isPublished, setIsPublished] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  /** -------- Load level when editing -------- */
  useEffect(() => {
    if (isNew) {
      // New level: auto-assign author and stop loading
      setAuthor(user.email || "");
      setLoading(false);
      return;
    }

    const load = async () => {
      const result = await getLevelById(id);

      if (result.success) {
        const d = result.data;

        setAuthor(d.author || "");
        setName(d.name || "");
        setKeywords(d.keywords || "");
        setPoses(d.poses || {});
        setDescription(d.description || "");
        setQuestion(d.question || "");
        setOptions(d.options || []);
        setAnswers(d.answers || []);
        setIsPublished(d.isPublished || false);
      } else {
        console.error(result.message);
      }

      setLoading(false);
    };

    load();
  }, [id, isNew, user]);

  /** --------- Pose Handlers --------- */
  const addPose = () => {
    const key = `pose${Date.now()}`;
    setPoses({ ...poses, [key]: "" });
  };

  const updatePose = (key, val) => {
    setPoses({ ...poses, [key]: val });
  };

  const removePose = (key) => {
    const copy = { ...poses };
    delete copy[key];
    setPoses(copy);
  };

  /** --------- Options & Answers --------- */
  const addOption = () => setOptions([...options, ""]);

  const updateOption = (i, val) => {
    const updated = [...options];
    updated[i] = val;
    setOptions(updated);
  };

  const removeOption = (i) => {
    setOptions(options.filter((_, idx) => idx !== i));
    setAnswers(answers.filter((ans) => ans !== i));
  };

  const toggleAnswer = (i) => {
    setAnswers(
      answers.includes(i)
        ? answers.filter((a) => a !== i)
        : [...answers, i]
    );
  };

  /** --------- Save / Publish --------- */
const saveLevel = async (publish) => {
  setSaving(true);
  setMsg("");

  const result = await writeLevel(
    isNew ? null : id,
    author,
    name,
    keywords,
    poses,
    description,
    question,
    options,
    answers,
    publish
  );

  setSaving(false);

  if (!result.success) {
    setMsg(result.message || "Error saving level.");
    return;
  }

  // Redirect to home ALWAYS
  navigate("/");
};

  if (loading) return <div className="level-editor">Loading…</div>;

  return (
    <div className="level-editor">
      <h1>{isNew ? "New Level" : "Edit Level"}</h1>

      {msg && <div className="msg">{msg}</div>}

      {/* Author (read-only / auto-set) */}
      <label>Author</label>
      <input value={author} readOnly disabled />

      {/* Name */}
      <label>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} />

      {/* Keywords */}
      <label>Keywords</label>
      <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />

      {/* Description */}
      <label>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Poses */}
      <div className="section">
        <label>Poses</label>

        {Object.entries(poses).map(([key, val]) => (
          <div className="row" key={key}>
            <input
              value={val}
              onChange={(e) => updatePose(key, e.target.value)}
            />
            <button onClick={() => removePose(key)}>X</button>
          </div>
        ))}

        <button onClick={addPose}>Add Pose</button>
      </div>

      {/* Question */}
      <label>Question</label>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      {/* Options */}
      <div className="section">
        <label>Options</label>

        {options.map((opt, i) => (
          <div className="row" key={i}>
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
            <input
              type="checkbox"
              checked={answers.includes(i)}
              onChange={() => toggleAnswer(i)}
            />
            <button onClick={() => removeOption(i)}>X</button>
          </div>
        ))}

        <button onClick={addOption}>Add Option</button>
      </div>

      {/* Save / Publish */}
      <div className="actions">
        <button disabled={saving} onClick={() => saveLevel(false)}>
          Save Draft
        </button>

        <button
          disabled={saving}
          onClick={() => saveLevel(true)}
          style={{ background: "#27ae60", color: "white" }}
        >
          Publish
        </button>
      </div>
    </div>
  );
}
