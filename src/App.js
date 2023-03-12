import { StrictMode, lazy, Suspense } from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Loader from "./components/utilities/Loader.js";
import Settings from "./components/Settings.js";
import * as PIXI from "pixi.js";
import "regenerator-runtime/runtime";

// This global declaration is necessary to make the chrome PIXI devtools work
window.PIXI = PIXI;
import Sandbox from "./components/Sandbox";
import PoseCapture from "./components/PoseCapture";
import SignIn from "./components/auth/SignIn";
const Story = lazy(() => import("./components/Story"));

// Firebase Init
import { app } from "./firebase/init";

import { writeUserData } from "./firebase/database";
import { conjectures } from "./models/conjectures.js";

// const Experimental_Data = [];

// Experimental_Data.push({
//   id: "username based on the UID of the user",
//   userId:
//     "user id that is generated by the firebase under authentication -> users -> UID",
//   poseData: "current pose data based on the frame rate limitation given",
//   conjectureId:
//     "add the conjecture id to determine the current point of the story",
//   timestamp: "current timestamp output by MediaPipe",
// });

// writeUserData(Experimental_Data);

// writeUserData(Experimental_Data);
// import { getDatabase, ref, set } from "firebase/database";

// function cwriteUserData(id, UserId, poseData, ConjuctureData, timestamp) {
//   const db = getDatabase();
//   set(ref(db, 'Experimental_Data/'), {
    
//   });
// }

function writeUserData(UId, poseData, ConjuctureData, timestamp) {
  var myRef = firebase.database().ref().child('Experimental_Data').push();
  var key = myRef.key();

  var newData = {
    id: key,
    uid: UId,
    poseData: poseData,
    ConjuctureId: ConjuctureData.id,
    timestamp: timestamp,
  };

  myRef.push(newData);
}
// writeUserData();
const { NODE_ENV } = process.env;

const App = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Router>
        <Switch>
          {NODE_ENV !== "production" && (
            <Route path="/sandbox">
              <Sandbox />
            </Route>
          )}
          {NODE_ENV !== "production" && (
            <Route path="/posecapture">
              <PoseCapture />
            </Route>
          )}
          <Route path="/settings">
            <Settings />
          </Route>
          {/* <Route path="/signin">
            <SignIn />
          </Route> */}
          <Route path="/">
            <Story />
          </Route>
        </Switch>
      </Router>
    </Suspense>
  );
};

render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById("root")
);
