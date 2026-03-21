import { Outlet } from "react-router-dom";
import { Navbar } from "../components";

export default function RootLayout() {
  return (
    <div className="h-dvh overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <Outlet />
    </div>
  );
}