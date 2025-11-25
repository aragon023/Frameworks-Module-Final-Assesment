import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import TasksPage from "./pages/TasksPage";
import CategoriesPage from "./pages/CategoriesPage";
import MembersPage from "./pages/MembersPage";
import PetsPage from "./pages/PetsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequireAuth from "./components/RequireAuth";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        />

        <Route
          path="/tasks"
          element={
            <RequireAuth>
              <TasksPage />
            </RequireAuth>
          }
        />

        <Route
          path="/categories"
          element={
            <RequireAuth>
              <CategoriesPage />
            </RequireAuth>
          }
        />

        <Route
          path="/members"
          element={
            <RequireAuth>
              <MembersPage />
            </RequireAuth>
          }
        />

        <Route
          path="/pets"
          element={
            <RequireAuth>
              <PetsPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
