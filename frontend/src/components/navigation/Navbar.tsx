import { NavItem } from "./NavItem";

export function Navbar() {
  return (
    <header className="border-b border-white/10">
      <div className="h-16 px-4 md:px-8 flex items-center">
        <div className="text-lg md:text-xl font-semibold tracking-wide text-white">
          Find new places to visit
        </div>

        <nav className="ml-auto mr-8 md:mr-16 h-full flex items-stretch gap-10 md:gap-14">
          <NavItem to="/">Home</NavItem>
          <NavItem to="/map">Map</NavItem>
          <NavItem to="/about">About</NavItem>
        </nav>
      </div>
    </header>
  );
}
