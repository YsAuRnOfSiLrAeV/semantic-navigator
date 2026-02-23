import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function SidePanel({ open, onClose, children }: Props) {
  // This component is the mobile/tablet drawer.
  return (
    <div className={`lg:hidden ${open ? "" : "pointer-events-none"}`}>
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[420px] bg-zinc-950 border-l border-white/10 transition-transform flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
          <div className="text-base font-semibold">Details</div>
          <button
            className="text-sm px-3 py-2 rounded border border-white/15 hover:border-white/30"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
