type NavigationButtonProps = {
  label: string;
  onClick: () => void;
  disabled: boolean;
};

export function NavigationButton({
  label,
  onClick,
  disabled,
}: NavigationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-xs md:text-sm font-medium text-zinc-100 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}
