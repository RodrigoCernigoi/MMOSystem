type GameIconProps = {
  name: string;
  size?: number;
  label?: string;
  className?: string;
};

export const GameIcon = ({ name, size = 22, label, className = "" }: GameIconProps) => (
  <span
    className={`game-icon ${className}`.trim()}
    aria-hidden={label ? undefined : true}
    aria-label={label}
    role={label ? "img" : undefined}
    style={{
      width: size,
      height: size,
      ["--game-icon-url" as string]: `url("https://api.iconify.design/game-icons/${name}.svg")`,
    }}
  />
);
