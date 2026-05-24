import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import "./styles.css";
import { AppLayout } from "./ui/AppLayout.jsx";
import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { ThreatFeed } from "./pages/ThreatFeed.jsx";
import { EmailDetail } from "./pages/EmailDetail.jsx";
import { Quarantine } from "./pages/Quarantine.jsx";
import { Analytics } from "./pages/Analytics.jsx";
import { Settings } from "./pages/Settings.jsx";
import { Policies } from "./pages/Policies.jsx";
import { AppError } from "./pages/AppError.jsx";

const router = createBrowserRouter([
  { path: "/login", element: <Login />, errorElement: <AppError /> },
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <AppError />,
    children: [
      { index: true, element: <Navigate to="/dashboard" /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "threats", element: <ThreatFeed /> },
      { path: "threats/:id", element: <EmailDetail /> },
      { path: "quarantine", element: <Quarantine /> },
      { path: "analytics", element: <Analytics /> },
      { path: "settings", element: <Settings /> },
      { path: "policies", element: <Policies /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />,
);
