// src/services/db/gameStore.js

/**
 * @typedef {Object} Sprite
 * @property {string} id
 * @property {string} name
 * @property {"character"|"prop"|"ui"|"effect"} type
 * @property {number} x
 * @property {number} y
 * @property {number} [rotation]
 * @property {number} [scale]
 * @property {number} [zIndex]
 * @property {Object} [appearance]
 * @property {Array<Object>} [behaviors]
 * @property {Object} [audio]
 * @property {Object} [meta]
 */

/**
 * @typedef {Object} Level
 * @property {string} id
 * @property {string} name
 * @property {string|null} [background]
 * @property {string[]} [dialogues]
 * @property {Object} [settings]
 * @property {Record<string, Sprite>} [sprites]
 * @property {Object} [audio]
 */

/**
 * @typedef {Object} GameDoc
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} version
 * @property {Object} [settings]
 * @property {string[]} [order]              
 * @property {Record<string, Level>} levels
 * @property {*} [createdAt]
 * @property {*} [updatedAt]
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firebaseDB } from "../Firebase/firebase";

// Helpers to build paths
const gamesCol = (uid) => collection(firebaseDB, "users", uid, "games");
const gameDoc = (uid, gameId) => doc(firebaseDB, "users", uid, "games", gameId);

/**
 * Infer a reasonable default order from the levels object.
 * Falls back to [] if nothing is there.
 */
function inferOrderFromLevels(levels) {
  if (!levels) return [];
  const ids = Object.keys(levels);
  return ids;
}

/** Create a new game (or merge if it exists). */
export async function createOrMergeGame(uid, game /** @type {Partial<GameDoc>} */) {
  if (!uid) throw new Error("uid required");
  if (!game?.id) throw new Error("game.id required");

  const ref = gameDoc(uid, game.id);
  const existingSnap = await getDoc(ref);
  const now = serverTimestamp();

  const baseLevels = game.levels || {};
  const baseOrder =
    Array.isArray(game.order) && game.order.length
      ? game.order
      : inferOrderFromLevels(baseLevels);

  const defaults = {
    version: 1,
    description: "",
    settings: {},
    order: baseOrder,
    levels: baseLevels,
  };

  const payload = {
    ...defaults,
    ...game,
    // Only set createdAt the first time
    ...(existingSnap.exists() ? {} : { createdAt: now }),
    updatedAt: now,
  };

  await setDoc(ref, payload, { merge: true });
  return ref.id;
}

/** Load a single game doc. */
export async function loadGame(uid, gameId) {
  if (!uid || !gameId) throw new Error("uid and gameId required");
  const snap = await getDoc(gameDoc(uid, gameId));
  return snap.exists() ? /** @type {GameDoc} */ (snap.data()) : null;
}

/** Convenience: load a single level from a game doc. */
export async function loadLevel(uid, gameId, levelId) {
  if (!uid || !gameId || !levelId) {
    throw new Error("uid, gameId and levelId required");
  }
  const game = await loadGame(uid, gameId);
  return game?.levels?.[levelId] || null;
}

/** List game headers for a user (id + name, sorted by updatedAt desc if present). */
export async function listGames(uid) {
  if (!uid) throw new Error("uid required");
  const q = query(gamesCol(uid));
  const snap = await getDocs(q);

  const games = snap.docs.map((d) => {
    const data = d.data();
    const { name, updatedAt } = data;
    return {
      id: d.id, // always have an id, even if it's not stored in the document
      name,
      updatedAt: updatedAt || null,
    };
  });

  // Optional: sort by updatedAt (newest first), nulls last
  games.sort((a, b) => {
    if (!a.updatedAt && !b.updatedAt) return 0;
    if (!a.updatedAt) return 1;
    if (!b.updatedAt) return -1;
    // Firestore Timestamp has a compareTo method, but in JS we can compare seconds/nanoseconds
    const aSec = a.updatedAt.seconds ?? 0;
    const bSec = b.updatedAt.seconds ?? 0;
    if (aSec !== bSec) return bSec - aSec;
    const aNano = a.updatedAt.nanoseconds ?? 0;
    const bNano = b.updatedAt.nanoseconds ?? 0;
    return bNano - aNano;
  });

  return games;
}

/** Update shallow game fields (name, description, settings, order, etc.). */
export async function updateGameMeta(uid, gameId, patch) {
  if (!uid || !gameId) throw new Error("uid and gameId required");

  // Prevent accidental overwrite of id/levels via meta API
  const { id, levels, ...rest } = patch || {};
  await updateDoc(gameDoc(uid, gameId), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

/** Upsert a whole level under levels.{levelId}. */
export async function upsertLevel(uid, gameId, level /** @type {Level} */) {
  if (!uid || !gameId) throw new Error("uid and gameId required");
  if (!level?.id) throw new Error("level.id required");

  const path = `levels.${level.id}`;
  await updateDoc(gameDoc(uid, gameId), {
    [path]: level,
    updatedAt: serverTimestamp(),
  });
}

/** Patch a level (only given keys) using current doc merge. */
export async function patchLevel(
  uid,
  gameId,
  levelId,
  patch /** @type {Partial<Level>} */
) {
  if (!uid || !gameId || !levelId) {
    throw new Error("uid, gameId and levelId required");
  }

  const path = `levels.${levelId}`;
  const current = await loadGame(uid, gameId);
  const merged = { ...(current?.levels?.[levelId] || { id: levelId }), ...patch };

  await updateDoc(gameDoc(uid, gameId), {
    [path]: merged,
    updatedAt: serverTimestamp(),
  });
}

/** Upsert a sprite: levels.{levelId}.sprites.{spriteId} = sprite */
export async function upsertSprite(
  uid,
  gameId,
  levelId,
  sprite /** @type {Sprite} */
) {
  if (!uid || !gameId || !levelId) {
    throw new Error("uid, gameId and levelId required");
  }
  if (!sprite?.id) throw new Error("sprite.id required");

  const path = `levels.${levelId}.sprites.${sprite.id}`;
  await updateDoc(gameDoc(uid, gameId), {
    [path]: sprite,
    updatedAt: serverTimestamp(),
  });
}

/** Patch a sprite via nested dot-path. */
export async function patchSprite(
  uid,
  gameId,
  levelId,
  spriteId,
  patch /** @type {Partial<Sprite>} */
) {
  if (!uid || !gameId || !levelId || !spriteId) {
    throw new Error("uid, gameId, levelId and spriteId required");
  }

  const path = `levels.${levelId}.sprites.${spriteId}`;
  const current = await loadGame(uid, gameId);
  const base = current?.levels?.[levelId]?.sprites?.[spriteId] || { id: spriteId };

  await updateDoc(gameDoc(uid, gameId), {
    [path]: { ...base, ...patch },
    updatedAt: serverTimestamp(),
  });
}

/** Remove a sprite. */
export async function deleteSprite(uid, gameId, levelId, spriteId) {
  if (!uid || !gameId || !levelId || !spriteId) {
    throw new Error("uid, gameId, levelId and spriteId required");
  }

  const game = await loadGame(uid, gameId);
  if (!game?.levels?.[levelId]?.sprites?.[spriteId]) return;

  const level = { ...game.levels[levelId] };
  const { [spriteId]: _removed, ...rest } = level.sprites || {};

  await patchLevel(uid, gameId, levelId, { sprites: rest });
}

/** Delete a level. */
export async function deleteLevel(uid, gameId, levelId) {
  if (!uid || !gameId || !levelId) {
    throw new Error("uid, gameId and levelId required");
  }

  const game = await loadGame(uid, gameId);
  if (!game?.levels?.[levelId]) return;

  const { [levelId]: _removed, ...rest } = game.levels;
  const newOrder = (game.order || []).filter((id) => id !== levelId);

  await updateDoc(gameDoc(uid, gameId), {
    levels: rest,
    order: newOrder,
    updatedAt: serverTimestamp(),
  });
}

/** Delete an entire game. */
export async function deleteGame(uid, gameId) {
  if (!uid || !gameId) throw new Error("uid and gameId required");
  await deleteDoc(gameDoc(uid, gameId));
}

/** Local draft helpers (safe offline fallback). */
const DRAFT_KEY = (uid, gameId) => `hv:draft:${uid}:${gameId}`;

export function saveDraft(uid, gameId, data /** @type {GameDoc} */) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(DRAFT_KEY(uid, gameId), JSON.stringify(data));
}

export function loadDraft(uid, gameId) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(DRAFT_KEY(uid, gameId));
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Export helpers */
export function gameToJSONBlob(game /** @type {GameDoc} */) {
  const blob = new Blob([JSON.stringify(game, null, 2)], {
    type: "application/json",
  });
  return blob;
}
