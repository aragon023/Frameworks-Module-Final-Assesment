import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import TasksPage from "./pages/TasksPage";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard (Root) */}
        <Route path="/" element={<App />} />

        {/* Full Tasks Page */}
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </BrowserRouter>
  );
}
