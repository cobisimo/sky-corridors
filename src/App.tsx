import CorridorMap from "./CorridorMap";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";

const ProtectedRoute = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function LoginWrapper({ onLogin }) {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    // If you haven't moved preventDefault to the Login component:
    if (e && e.preventDefault) e.preventDefault();

    onLogin();       // Set isAuthenticated to true
    navigate("/");   // Programmatic redirect
  };

  return <Login onLogin={handleLogin} />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    const navigate = useNavigate();
    setIsAuthenticated(true);
    navigate("/");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginWrapper onLogin={() => setIsAuthenticated(true)} />}
        />
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/" element={<CorridorMap />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
