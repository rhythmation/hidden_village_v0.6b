import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home/home.jsx";
import GameMenu from "./pages/GameMenu/GameMenu.jsx";
import GameEditor from "./pages/GameEditor/gameEditor.jsx";
import GamePlayer from "./components/Game/GamePlayer.jsx";
import Settings from "./pages/settings/settings.jsx";
import SignIn from "./pages/Auth/signIn/signIn.jsx";
import UserManage from "./pages/UserManage/UserManage.jsx";
import ProtectedRoute from "./components/util/ProtectedRoute.jsx";
import SignUp from "./pages/Auth/signUp/signUp.jsx";
import StudentAuth from "./pages/Auth/studentAuth/studentAuth.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import AdminRoute from "./components/util/AdminRoute.jsx";
import PlaceHolder from "./pages/Placeholder/Placeholder.jsx";
import LevelEditor from "./pages/LevelEditor/LevelEditor.jsx";
import LevelMenu from "./pages/LevelMenu/levelMenu.jsx";

const App = () => {
  const { user, loading } = useAuth();

  const isLoggedIn = !!user;
  const adminStatus = user && !user.isAnonymous && user.emailVerified;

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Layout>
        <Routes>
          {/* PUBLIC */}
          <Route path="signIn" element={<StudentAuth />} />
          <Route path="AdminSignIn" element={<SignIn />} />
          <Route path="AdminSignUp" element={<SignUp />} />
          <Route path="Placeholder" element={<PlaceHolder />} />

          {/* PROTECTED */}
          <Route element={<ProtectedRoute isLoggedIn={isLoggedIn} />}>
            <Route path="/" element={<Home />} />

            <Route path="game">
              <Route path="play" element={<GameMenu mode="play" />} />
              <Route path="play/:gameId" element={<GamePlayer />} />

              <Route path="edit/new" element={<GameEditor isNew />} />
              <Route path="edit" element={<GameMenu mode="edit" />} />
              <Route path="edit/:id" element={<GameEditor isNew={false} />} />
            </Route>

            <Route path="level">
              <Route path="edit/new" element={<LevelEditor isNew />} />
              <Route path="edit" element={<LevelMenu mode="edit" />} />
              <Route path="edit/:id" element={<LevelEditor isNew={false} />} />
            </Route>

            <Route path="settings" element={<Settings />} />

            {/* ADMIN ROUTES */}
            <Route element={<AdminRoute adminStatus={adminStatus} />}>
              <Route path="userManage" element={<UserManage />} />
            </Route>
          </Route>

          <Route path="*" element={<StudentAuth />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;