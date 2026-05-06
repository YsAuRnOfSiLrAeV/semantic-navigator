import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

type NavItemProps = {
  to: string;
  children: ReactNode;
};

const linkBase =
  "h-full inline-flex items-center text-white text-sm md:text-base border-b-2 border-transparent -mb-px transition-colors";

export function NavItem({ to, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${linkBase} ${isActive ? "border-white" : "hover:border-white"}`
      }
    >
      {children}
    </NavLink>
  );
}