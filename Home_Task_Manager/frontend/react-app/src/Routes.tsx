import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import TasksPage from "./pages/TasksPage";
import CategoriesPage from "./pages/CategoriesPage";
import MembersPage from "./pages/MembersPage";
import PetsPage from "./pages/PetsPage";
import LoginPage from "./pages/LoginPage";





export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login Page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard (Root) */}
        <Route path="/" element={<App />} />

        {/* Full Tasks Page */}
        <Route path="/tasks" element={<TasksPage />} />

        {/* Categories Management */}
        <Route path="/categories" element={<CategoriesPage />} />

        {/* Members Management */}
        <Route path="/members" element={<MembersPage />} />

        {/* Pets Management */}
        <Route path="/pets" element={<PetsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
