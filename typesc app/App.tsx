// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PreTrade from "./pages/PreTrade";

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Home</h1>
      <p>Welcome to your portal app. Use the navigation above.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 border-b flex gap-4">
        <Link to="/">🏠 Home</Link>
        <Link to="/pre-trade">📊 Pre-Trade</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pre-trade" element={<PreTrade />} />
      </Routes>
    </BrowserRouter>
  );
}
