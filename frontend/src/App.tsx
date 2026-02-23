import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components";
import { HomePage, MapPage, AboutPage } from "./pages";

export default function App() {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
}
