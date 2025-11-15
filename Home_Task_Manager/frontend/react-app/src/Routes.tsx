import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import TasksPage from "./pages/TasksPage";
import CategoriesPage from "./pages/CategoriesPage";


export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard (Root) */}
        <Route path="/" element={<App />} />

        {/* Full Tasks Page */}
        <Route path="/tasks" element={<TasksPage />} />

        {/* Categories Management */}
        <Route path="/categories" element={<CategoriesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
