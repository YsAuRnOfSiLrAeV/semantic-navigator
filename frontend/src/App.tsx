import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import { HomePage, MapPage, AboutPage } from "./pages";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}