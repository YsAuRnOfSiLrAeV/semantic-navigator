import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkBase = "h-full inline-flex items-center text-white text-sm md:text-base border-b-2 border-transparent -mb-px transition-colors";

  return (
    <header className="border-b border-white/10">
      <div className="h-16 px-4 md:px-8 flex items-center">
        <div className="text-lg md:text-xl font-semibold tracking-wide text-white">Semantic Navigator</div>
        <nav className="ml-auto mr-8 md:mr-16 h-full flex items-stretch gap-10 md:gap-14">
          <NavLink to="/" className={({ isActive }) => `${linkBase} ${isActive ? "border-white" : "hover:border-white"}`}>Home</NavLink>
          <NavLink to="/map" className={({ isActive }) => `${linkBase} ${isActive ? "border-white" : "hover:border-white"}`}>Map</NavLink>
          <NavLink to="/about" className={({ isActive }) => `${linkBase} ${isActive ? "border-white" : "hover:border-white"}`}>About</NavLink>
        </nav>
      </div>
    </header>
  );
}
