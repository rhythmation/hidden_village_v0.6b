import {
  ref,
  push,
  getDatabase,
  get,
  update,
  set
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";

// Get database and storage instances
const db = getDatabase();
const storage = getStorage();

// ============================================
// GAME FUNCTIONS
// ============================================

/**
 * Writes or updates a game in Firebase.
 *
 * @param {string|null} id - Existing gameId OR null to generate a new one.
 * @param {string|null} author - Creator of the game.
 * @param {string|null} name - Game title.
 * @param {string|null} keywords - Search keywords.
 * @param {boolean} isPublished - Whether game is published.
 * @param {Array<string|null>} levelIds - List of level IDs.
 * @param {object|null} settings - Settings object.
 */
export const writeGame = async (
  id,
  author,
  name,
  keywords,
  isPublished,
  levelIds,
  settings,
  pin
) => {
  // If no id, generate one automatically
  const gameId = id || push(ref(db, "Games")).key;

  try {
    const safeLevelIds = Array.isArray(levelIds) ? levelIds : [];
    // All fields should be present for published games
    if (
      isPublished &&
      (
        !author ||
        !name ||
        !keywords ||
        !settings ||
        safeLevelIds.length === 0 ||
        safeLevelIds.some((id) => id == null ||
          pin == null)
      )
    ) {
      return {
        success: false,
        status: 400,
        message:
          "Published game must have all required fields and valid levelIds.",
      };
    }

    // ================================
    // NORMALIZE LEVEL IDS AS OBJ
    // ================================
    const levelIdsObj = {};
    safeLevelIds.forEach((lvlId, index) => {
      levelIdsObj[index] = lvlId ?? null;
    });

    const metadata = {
      author: author ?? null,
      name: name ?? null,
      keywords: keywords ?? null,
      isPublished: isPublished ?? false,
      pin: pin,
    };

    const gameData = {
      ...metadata,
      settings: settings ?? {},
      levelIds: levelIdsObj,
    };

    const updates = {
      [`GameList/${gameId}`]: metadata,
      [`Games/${gameId}`]: gameData,
    };

    await update(ref(db), updates);

    return {
      success: true,
      status: 200,
      message: "Game saved successfully.",
      data: { gameId },
    };
  } catch (error) {
    console.error("writeGame error:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to save game.",
      error: {
        code: error.code || "FIREBASE_WRITE_ERROR",
        details: error.message,
        stack: error.stack,
      },
    };
  }
};

/**
 * Get all games from database for Game Menu
 * @returns { success, data, message? }
 */
export const getGamesList = async () => {
  try {
    const snapshot = await get(ref(db, "GameList"));
    if (!snapshot.exists()) {
      return {
        success: true,
        data: {},
        message: "No games found (empty DB)",
      };
    }

    const rawData = snapshot.val();
    const structuredData = Object.fromEntries(
      Object.entries(rawData).map(([gameId, game]) => [
        gameId,
        {
          author: game?.author ?? null,
          name: game?.name ?? null,
          keywords: game?.keywords ?? null,
          isPublished: game?.isPublished ?? false,
        },
      ])
    );

    return { success: true, data: structuredData };
  } catch (error) {
    console.error("getGamesList error:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch games",
    };
  }
};

/**
 * Get specific game by id
 * @param {string} id - Game ID
 * @returns { success, status, data?, message?, error? }
 */
export const getGameById = async (id) => {
  if (!id) {
    return {
      success: false,
      status: 400,
      message: "Missing game id.",
    };
  }

  try {
    const snapshot = await get(ref(db, `Games/${id}`));
    if (!snapshot.exists()) {
      return {
        success: false,
        status: 404,
        message: "Game not found.",
      };
    }

    const game = snapshot.val() || {};

    // Enforce null-safe structure and ordered levelIds
    const structuredGame = {
      author: game.author ?? null,
      name: game.name ?? null,
      keywords: game.keywords ?? null,
      isPublished: game.isPublished ?? false,
      settings: game.settings ?? {},
      levelIds: Array.isArray(game.levelIds)
        ? game.levelIds
        : game.levelIds
          ? Object.keys(game.levelIds)
            .sort((a, b) => a - b)
            .map((k) => game.levelIds[k] ?? null)
          : [],
    };

    return {
      success: true,
      status: 200,
      data: { id, ...structuredGame },
    };
  } catch (error) {
    console.error("getGameById error:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to fetch game.",
      error: error?.message || error,
    };
  }
};

/**
 * Delete a game by id
 * @param {string} id - Game ID to delete
 * @returns { success, status, message }
 */
export const deleteGameById = async (id) => {
  if (!id) {
    return {
      success: false,
      status: 400,
      message: "Missing game id.",
    };
  }

  try {
    const updates = {
      [`GameList/${id}`]: null,
      [`Games/${id}`]: null,
    };
    await update(ref(db), updates);

    return {
      success: true,
      status: 200,
      message: "Game deleted successfully.",
    };
  } catch (error) {
    console.error("deleteGameById error:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to delete game.",
      error: error?.message || error,
    };
  }
};

// ============================================
// LEVEL FUNCTIONS
// ============================================

/**
 * Write/update a level
 * @param {string|null} id - Existing level id or null for new
 * @param {string} author - Author email/name
 * @param {string} name - Level name
 * @param {string|array} keywords - Search keywords
 * @param {object} poses - Pose data
 * @param {string} description - Level description
 * @param {string} question - Quiz question
 * @param {array} options - Quiz options
 * @param {array} answers - Correct answers
 * @param {boolean} isPublished - Published status
 * @returns { success, data?, message, error? }
 */
export const writeLevel = async (
  id,
  author,
  name,
  keywords,
  poses,
  description,
  question,
  options,
  answers,
  isPublished
) => {
  const levelId = id || push(ref(db, "Level")).key;

  try {
    const safeOptions = Array.isArray(options) ? options : [];
    const safeAnswers = Array.isArray(answers) ? answers : [];

    // Validate required fields for published levels
    if (
      isPublished &&
      (!author || !name || !poses || !question || safeOptions.length === 0 || safeAnswers.length === 0)
    ) {
      return {
        success: false,
        status: 400,
        message: "Missing required fields for published level.",
      };
    }

    const updates = {
      [`LevelList/${levelId}`]: {
        author: author ?? null,
        name: name ?? null,
        keywords: keywords ?? null,
        isPublished: isPublished ?? false,
      },
      [`Level/${levelId}`]: {
        author: author ?? null,
        name: name ?? null,
        keywords: keywords ?? null,
        poses: poses ?? {},
        description: description ?? null,
        question: question ?? null,
        options: safeOptions,
        answers: safeAnswers,
        isPublished: isPublished ?? false,
      },
    };

    await update(ref(db), updates);

    return {
      success: true,
      data: { levelId },
      message: "Level saved successfully",
    };
  } catch (error) {
    console.error("writeLevel error:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to save level",
      error: error?.message || "WRITE_LEVEL_ERROR",
    };
  }
};

/**
 * Get all levels for Level Menu
 * @returns { success, data, message?, error? }
 */
export const getLevelList = async () => {
  try {
    const snapshot = await get(ref(db, "LevelList"));
    if (!snapshot.exists()) {
      return {
        success: true,
        data: {},
        message: "No levels found (empty DB)",
      };
    }

    const rawData = snapshot.val();
    const structuredData = Object.fromEntries(
      Object.entries(rawData).map(([levelId, level]) => [
        levelId,
        {
          author: level?.author ?? null,
          name: level?.name ?? null,
          keywords: level?.keywords ?? null,
          isPublished: level?.isPublished ?? false,
        },
      ])
    );

    return { success: true, data: structuredData };
  } catch (error) {
    console.error("getLevelList error:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch levels",
    };
  }
};

/**
 * Get specific level by id
 * @param {string} id - Level ID
 * @returns { success, status, data?, message?, error? }
 */
export const getLevelById = async (id) => {
  if (!id) {
    return {
      success: false,
      status: 400,
      message: "Missing level id.",
    };
  }

  try {
    const snapshot = await get(ref(db, `Level/${id}`));
    if (!snapshot.exists()) {
      return {
        success: false,
        status: 404,
        message: "Level not found.",
      };
    }

    const level = snapshot.val() || {};

    const structuredLevel = {
      id,
      author: level.author ?? null,
      name: level.name ?? null,
      keywords: level.keywords ?? null,
      poses: level.poses ?? {},
      description: level.description ?? null,
      question: level.question ?? null,
      options: Array.isArray(level.options) ? level.options : [],
      answers: Array.isArray(level.answers) ? level.answers : [],
      isPublished: level.isPublished ?? false,
    };

    return {
      success: true,
      status: 200,
      data: structuredLevel,
    };
  } catch (error) {
    console.error("getLevelById error:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to fetch level.",
      error: error?.message || error,
    };
  }
};

/**
 * Delete a level by id
 * @param {string} id - Level ID to delete
 * @returns { success, status, message }
 */
export const deleteLevelById = async (id) => {
  if (!id) {
    return {
      success: false,
      status: 400,
      message: "Missing level id.",
    };
  }

  try {
    const updates = {
      [`LevelList/${id}`]: null,
      [`Level/${id}`]: null,
    };
    await update(ref(db), updates);

    return {
      success: true,
      status: 200,
      message: "Level deleted successfully.",
    };
  } catch (error) {
    console.error("deleteLevelById error:", error);
    return {
      success: false,
      status: 500,
      message: "Failed to delete level.",
      error: error?.message || error,
    };
  }
};

// ============================================
// GAMEPLAY SESSION FUNCTIONS - THEY HAVENT BEEN TESTED, WILL MODIFY WHEN TIME COMES
// ============================================

/**
 * Write batch of frame data for a gameplay session
 * Uses efficient batch writes without reading entire array
 * Path: UserGameplay/{userId}/games/{gameId}/levels/{levelId}/sessions/{sessionId}/frames/{frameIndex}
 * @param {string} userId - User ID
 * @param {string} gameId - Game ID
 * @param {string} levelId - Level ID
 * @param {string} sessionId - Session ID
 * @param {array} framesBatch - Array of frame data
 * @param {number} startIndex - Starting frame index for this batch
 * @returns { success, nextIndex?, error? }
 */
export const writeGameplayFrames = async (
  userId,
  gameId,
  levelId,
  sessionId,
  framesBatch,
  startIndex
) => {
  if (!userId || !gameId || !levelId || !sessionId || !framesBatch || framesBatch.length === 0 || startIndex === undefined) {
    return { success: false, error: "Invalid parameters" };
  }

  try {
    // Build update object with indexed keys (no read required!)
    const updates = {};
    framesBatch.forEach((frame, index) => {
      const frameIndex = startIndex + index;
      updates[`UserGameplay/${userId}/games/${gameId}/levels/${levelId}/sessions/${sessionId}/frames/${frameIndex}`] = frame;
    });

    // Single atomic write for all frames in batch
    await update(ref(db), updates);

    return {
      success: true,
      nextIndex: startIndex + framesBatch.length
    };
  } catch (error) {
    console.error("writeGameplayFrames error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Upload video to Firebase Storage (NOT Realtime Database - videos are too large)
 * @param {string} userId - User ID
 * @param {string} gameId - Game ID
 * @param {string} levelId - Level ID
 * @param {string} sessionId - Session ID
 * @param {Blob} videoBlob - Video blob data
 * @returns { success, url?, error? }
 */
export const uploadGameplayVideo = async (
  userId,
  gameId,
  levelId,
  sessionId,
  videoBlob
) => {
  if (!userId || !gameId || !levelId || !sessionId || !videoBlob) {
    return { success: false, error: "Invalid parameters" };
  }

  try {
    const videoPath = `gameplay-videos/${userId}/${gameId}/${levelId}/${sessionId}.webm`;
    const videoRef = storageRef(storage, videoPath);

    // Upload video to Storage
    await uploadBytes(videoRef, videoBlob);

    // Get download URL
    const downloadURL = await getDownloadURL(videoRef);

    // Store URL reference in Realtime Database
    await set(
      ref(db, `UserGameplay/${userId}/games/${gameId}/levels/${levelId}/sessions/${sessionId}/video`),
      {
        url: downloadURL,
        path: videoPath,
        uploadedAt: Date.now(),
      }
    );

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("uploadGameplayVideo error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Write gameplay session metadata
 * @param {string} userId - User ID
 * @param {string} gameId - Game ID
 * @param {string} levelId - Level ID
 * @param {string} sessionId - Session ID
 * @param {string} deviceId - Device identifier (browser fingerprint, device UUID, etc.)
 * @param {object} sessionData - Session metadata (score, duration, etc.)
 * @returns { success, error? }
 */
export const writeGameSession = async (
  userId,
  gameId,
  levelId,
  sessionId,
  deviceId,
  sessionData
) => {
  if (!userId || !sessionId || !deviceId || !sessionData) {
    return { success: false, error: "Invalid parameters" };
  }

  try {
    await set(
      ref(db, `UserGameplay/${userId}/sessions/${sessionId}/metadata`),
      {
        gameId,
        levelId,
        deviceId, // Track which device played
        ...sessionData,
        createdAt: Date.now(),
      }
    );

    return { success: true };
  } catch (error) {
    console.error("writeGameSession error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Get all gameplay sessions for a user
 * @param {string} userId - User ID
 * @returns { success, data?, error? }
 */
export const getUserGameplaySessions = async (userId) => {
  if (!userId) {
    return { success: false, error: "Missing userId" };
  }

  try {
    const snapshot = await get(ref(db, `UserGameplay/${userId}/sessions`));

    if (!snapshot.exists()) {
      return { success: true, data: {} };
    }

    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error("getUserGameplaySessions error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Get specific session data including all frames and video
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns { success, data?, error? }
 */
export const getSessionById = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const snapshot = await get(
      ref(db, `UserGameplay/${userId}/sessions/${sessionId}`)
    );

    if (!snapshot.exists()) {
      return { success: false, error: "Session not found" };
    }

    const sessionData = snapshot.val();

    // Convert frames object to sorted array for easy playback
    if (sessionData.frames) {
      const framesObj = sessionData.frames;
      sessionData.frames = Object.keys(framesObj)
        .map(key => parseInt(key))
        .sort((a, b) => a - b)
        .map(index => framesObj[index]);
    }

    return { success: true, data: sessionData };
  } catch (error) {
    console.error("getSessionById error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Get frame range from a session (for efficient partial loading)
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @param {number} startFrame - Starting frame index
 * @param {number} endFrame - Ending frame index
 * @returns { success, data?, error? }
 */
export const getSessionFrameRange = async (userId, sessionId, startFrame, endFrame) => {
  if (!userId || !sessionId || startFrame === undefined || endFrame === undefined) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const frames = [];

    // Query specific frame range
    for (let i = startFrame; i <= endFrame; i++) {
      const snapshot = await get(
        ref(db, `UserGameplay/${userId}/sessions/${sessionId}/frames/${i}`)
      );
      if (snapshot.exists()) {
        frames.push(snapshot.val());
      }
    }

    return { success: true, data: frames };
  } catch (error) {
    console.error("getSessionFrameRange error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Get total frame count for a session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns { success, count?, error? }
 */
export const getSessionFrameCount = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const snapshot = await get(
      ref(db, `UserGameplay/${userId}/sessions/${sessionId}/metadata/totalFrames`)
    );

    if (!snapshot.exists()) {
      return { success: false, error: "Frame count not found" };
    }

    return { success: true, count: snapshot.val() };
  } catch (error) {
    console.error("getSessionFrameCount error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Get session metadata only (without frames - lighter query)
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns { success, data?, error? }
 */
export const getSessionMetadata = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const snapshot = await get(
      ref(db, `UserGameplay/${userId}/sessions/${sessionId}/metadata`)
    );

    if (!snapshot.exists()) {
      return { success: false, error: "Session metadata not found" };
    }

    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error("getSessionMetadata error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Delete a gameplay session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns { success, error? }
 */
export const deleteSession = async (userId, sessionId) => {
  if (!userId || !sessionId) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    // Delete from Realtime Database
    await set(ref(db, `UserGameplay/${userId}/sessions/${sessionId}`), null);

    // Note: You may also want to delete the video from Storage
    // This requires getting the video path first, then using deleteObject()

    return { success: true };
  } catch (error) {
    console.error("deleteSession error:", error);
    return { success: false, error: error?.message };
  }
};

// ============================================
// USER STATISTICS FUNCTIONS
// ============================================

/**
 * Update user statistics (scores, achievements, etc.)
 * @param {string} userId - User ID
 * @param {object} stats - Statistics object
 * @returns { success, error? }
 */
export const updateUserStats = async (userId, stats) => {
  if (!userId || !stats) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    await update(ref(db, `UserStats/${userId}`), {
      ...stats,
      lastUpdated: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("updateUserStats error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Get user statistics
 * @param {string} userId - User ID
 * @returns { success, data?, error? }
 */
export const getUserStats = async (userId) => {
  if (!userId) {
    return { success: false, error: "Missing userId" };
  }

  try {
    const snapshot = await get(ref(db, `UserStats/${userId}`));

    if (!snapshot.exists()) {
      return { success: true, data: {} };
    }

    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error("getUserStats error:", error);
    return { success: false, error: error?.message };
  }
};

// ============================================
// LEADERBOARD FUNCTIONS
// ============================================

/**
 * Add score to leaderboard
 * @param {string} gameId - Game ID
 * @param {string} levelId - Level ID
 * @param {string} userId - User ID
 * @param {string} userName - User display name
 * @param {number} score - Score value
 * @returns { success, error? }
 */
export const addToLeaderboard = async (
  gameId,
  levelId,
  userId,
  userName,
  score
) => {
  if (!gameId || !levelId || !userId || score === undefined) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const entryId = push(ref(db, `Leaderboards/${gameId}/${levelId}`)).key;

    await set(ref(db, `Leaderboards/${gameId}/${levelId}/${entryId}`), {
      userId,
      userName,
      score,
      timestamp: Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("addToLeaderboard error:", error);
    return { success: false, error: error?.message };
  }
};

/**
 * Get leaderboard for a level
 * @param {string} gameId - Game ID
 * @param {string} levelId - Level ID
 * @param {number} limit - Number of top scores to return (optional)
 * @returns { success, data?, error? }
 */
export const getLeaderboard = async (gameId, levelId, limit = 100) => {
  if (!gameId || !levelId) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const snapshot = await get(ref(db, `Leaderboards/${gameId}/${levelId}`));

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    // Convert to array and sort by score
    const entries = Object.entries(snapshot.val()).map(([id, data]) => ({
      id,
      ...data,
    }));

    entries.sort((a, b) => b.score - a.score);

    return { success: true, data: entries.slice(0, limit) };
  } catch (error) {
    console.error("getLeaderboard error:", error);
    return { success: false, error: error?.message };
  }
};

// ============================================
// DEVICE TRACKING FUNCTIONS
// ============================================

/**
 * Get or create a unique device ID for this browser/device
 * Uses browser fingerprinting to identify device
 * @returns {string} Device ID
 */
export const getDeviceId = () => {
  // Check if device ID already exists in localStorage
  let deviceId = localStorage.getItem('deviceId');

  if (!deviceId) {
    // Generate device fingerprint based on browser/device characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      navigator.deviceMemory,
    ].join('|');

    // Create hash of fingerprint + random component for uniqueness
    deviceId = `device_${btoa(fingerprint).substring(0, 20)}_${Date.now()}`;
    localStorage.setItem('deviceId', deviceId);
  }

  return deviceId;
};

/**
 * Get device information
 * @returns {object} Device details
 */
export const getDeviceInfo = () => {
  return {
    deviceId: getDeviceId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

/**
 * Get all sessions for a specific device
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 * @returns { success, data?, error? }
 */
export const getDeviceSessions = async (userId, deviceId) => {
  if (!userId || !deviceId) {
    return { success: false, error: "Missing parameters" };
  }

  try {
    const snapshot = await get(ref(db, `UserGameplay/${userId}/sessions`));

    if (!snapshot.exists()) {
      return { success: true, data: [] };
    }

    // Filter sessions by device
    const allSessions = snapshot.val();
    const deviceSessions = Object.entries(allSessions)
      .filter(([_, session]) => session.metadata?.deviceId === deviceId)
      .map(([sessionId, sessionData]) => ({ sessionId, ...sessionData }));

    return { success: true, data: deviceSessions };
  } catch (error) {
    console.error("getDeviceSessions error:", error);
    return { success: false, error: error?.message };
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  // Game functions
  getGamesList,
  getGameById,
  writeGame,
  deleteGameById,

  // Level functions
  getLevelList,
  getLevelById,
  writeLevel,
  deleteLevelById,

  // Gameplay session functions
  writeGameplayFrames,
  uploadGameplayVideo,
  writeGameSession,
  getUserGameplaySessions,
  getSessionById,
  getSessionFrameRange,
  getSessionFrameCount,
  getSessionMetadata,
  deleteSession,

  // User stats
  updateUserStats,
  getUserStats,

  // Leaderboard
  addToLeaderboard,
  getLeaderboard,

  // Device tracking
  getDeviceId,
  getDeviceInfo,
  getDeviceSessions,
};

// More functions and updates needed:
// Ask if Michael wants the levels in an already made and saved game to not update on change to the levels in level editor as it is already saved,
// if levels are updated, then they would NEED to remove the old level and attach the new one in the game.
// Implement character limits, only show the users the games they have created, add group functionality like an org so that they can edit games in collaboration.
// Functions should authenticate and authorize user before critical database calls like delete, admins may be given the supreme power to override
//
// Search game by name would be implemented by filtering the list we get in menu, we will not make database calls/
// Add functions to record video, capture pose and record other data while playing game
//
// Add story, pictures etc fields for each game
//
// Games will only have level id attached to maintain fresh data and remove duplicate update,
// if needed create level id to name mapping to implement level menu for a specific game
//
// store the list of created game/level ids of each user as their field
// so that we can look it up quickly and enforce new games/levels created have distinct names
// SEE if firebase rules can implement that uniqueness for us
//
// We batch updates together to save performance





// Example: Auto-create a dummy unpublished game
/* const dummyGame = {
  id: null,
  author: user.email,
  name: "Hidden Village Prototype",
  keywords: ["test", "prototype", "demo"],
  isPublished: false,
  levelIds: {
    level1: { name: "Forest Entrance", difficulty: "Easy" },
    level2: { name: "Mountain Path", difficulty: "Medium" }
  },
  settings: {
    difficulty: "Normal",
    maxPlayers: 1,
    environment: "Fantasy"
  }
};

try {
  const result = await writeGame(
    dummyGame.id,
    dummyGame.author,
    dummyGame.name,
    dummyGame.keywords,
    dummyGame.isPublished,
    dummyGame.levelIds,
    dummyGame.settings
  );
  console.log("Auto-created dummy game:", result);
} catch (error) {
  console.error("Failed to auto-create dummy game:", error);
} */
