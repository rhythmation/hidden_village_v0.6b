import { ref, push, getDatabase, set, query, equalTo, get, orderByChild, orderByKey, onValue, child, startAt, endAt, remove, update } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";

// Get database instance
const db = getDatabase();
// Get auth instance

/* 
 * @description Method to get Game names from database for Game Menu
 * @args none
 * @returns
 */
export const getGamesList = async () => {
  try {
    const snapshot = await get(ref(db, 'GameList'));
    if (!snapshot.exists()) {
      return { success: true, data: {}, message: "No games found (empty DB)" };
    }
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error("getGamesList error:", error);
    return { success: false, error: error.message || "Failed to fetch games" };
  }
};

/*
 * @description Method to get contents for a specific game 
 * @args id game id
 * @returns
 */
export const getGameById = async(id) => {
  
}

/* 
 * @description Method to write a game to the database, probably called on save
 * @args 
 * @returns 
 */
export const writeGame = async (id, author, name, keywords, isPublished, levelIds, settings) => {
  // If it is a new game, id is null
  const gameId = id || uuidv4();

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
      [`Games/${gameId}`]: { author, name, keywords, isPublished, levelIds, settings },
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
 * 
 *
 */
export const getLevelList = async() => {
  try {
    const snapshot = await get(ref(db, 'LevelList'));
    if (!snapshot.exists()) {
      return { success: true, data: {}, message: "No levels found (empty DB)" };
    }
    return { success: true, data: snapshot.val() };
  } catch (error) {
    console.error("getLevelList error:", error);
    return { success: false, error: error.message || "Failed to fetch levels" };
  }
}

/* 
 * 
 *
 */
export const getLevelById = async() => {
  
}

/* 
 *
 *
 */
export const writeLevel = async (id, author, name, keywords, poses, description, question, options, answers, isPublished) => {
  // if new level, id is null
  const levelId = id || uuidv4();

  try {
    // If user is trying to publish level with empty fields, throw error.
    // Only unpublished level fields can be empty.
    if (isPublished && (!author || !name || !poses || !question || !options || !answers)) {
      return { success: false, error: "Missing required fields for published level." };
    }

    const updates = {
      [`LevelList/${levelId}`]: { author, name, keywords, isPublished },
      [`Level/${levelId}`]: { author, name, keywords, isPublished, poses, description, question, options, answers },
    };
    await update(ref(db), updates);

    return { success: true, data: { levelId }, message: "Level saved successfully" };
  } catch (error) {
    console.error("writeLevel error:", error);
    return { success: false, error: error.message || "Failed to save level" };
  }
};

/* 
 * 
 *
 */
export const deleteGameById = async(id) => {
  
}

/* 
 * 
 *
 */
export const searchGameById = async(id) => {
  // we will have entire games list in the game menu, 
  // so implement regex simply from the menu, 
  // shift it to GameMenu.jsx file
}

/* 
 * 
 *
 */
export const searchLevelById = async(id) => {
  // we will have entire levels list in the level menu, 
  // so implement regex simply from the menu, 
  // shift it to that file
}

/* 
 * 
 *
 */
export const deleteLevelById = async(id) => {
  
}



// More functions and updates needed:
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





