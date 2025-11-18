import {
  ref,
  push,
  getDatabase,
  get,
  update,
} from "firebase/database";

// Get database instance *for our initialized app*
const db = getDatabase();

/*
 * @description Get Game names from database for Game Menu
 * @args none
 * @returns { success, data, message? } where data is the GameList object
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
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error("getGamesList error:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch games",
    };
  }
};

/*
 * @description Get contents for a specific game by id
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
    return {
      success: true,
      status: 200,
      data: { id, ...game },
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

/*
 * @description Write a game to the database, probably called on save
 * @args
 *   id           - existing game id or null for new
 *   author       - string
 *   name         - string
 *   keywords     - string or array
 *   isPublished  - boolean
 *   levelIds     - array of level ids
 *   settings     - arbitrary object
 */
export const writeGame = async (
  id,
  author,
  name,
  keywords,
  isPublished,
  levelIds,
  settings
) => {
  // If it is a new game, generate a Firebase key
  const gameId = id || push(ref(db, "Games")).key;

  try {
    // If user is trying to publish game with empty fields, throw error.
    // Only unpublished game fields can be empty.
    if (isPublished && (!author || !name || !keywords || !settings)) {
      return {
        success: false,
        status: 400,
        message: "Missing required fields for published game.",
      };
    }

    // Batch updates together as this is an expensive operation.
    const updates = {
      [`GameList/${gameId}`]: { author, name, keywords, isPublished },
      [`Games/${gameId}`]: {
        author,
        name,
        keywords,
        isPublished,
        levelIds,
        settings,
      },
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

/*
 * @description Get all levels (for Level Menu / editor UI)
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
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error("getLevelList error:", error);
    return {
      success: false,
      error: error?.message || "Failed to fetch levels",
    };
  }
};

/*
 * @description Get a single level by id
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
    return {
      success: true,
      status: 200,
      data: { id, ...level },
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

/*
 * @description Write / update a level
 * @args
 *   id           - existing level id or null for new
 *   author       - string
 *   name         - string
 *   keywords     - string or array
 *   poses        - pose data
 *   description  - string
 *   question     - string
 *   options      - array
 *   answers      - array
 *   isPublished  - boolean
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
  // if new level, generate a Firebase key
  const levelId = id || push(ref(db, "Level")).key;

  try {
    // If user is trying to publish level with empty fields, throw error.
    // Only unpublished level fields can be empty.
    if (
      isPublished &&
      (!author || !name || !poses || !question || !options || !answers)
    ) {
      return {
        success: false,
        error: "Missing required fields for published level.",
      };
    }

    const updates = {
      [`LevelList/${levelId}`]: { author, name, keywords, isPublished },
      [`Level/${levelId}`]: {
        author,
        name,
        keywords,
        isPublished,
        poses,
        description,
        question,
        options,
        answers,
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
      error: error?.message || "Failed to save level",
    };
  }
};

/*
 * @description Delete a game by id (removes from GameList and Games)
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

/*
 * @description Delete a level by id (removes from LevelList and Level)
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




// More functions and updates needed:
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
