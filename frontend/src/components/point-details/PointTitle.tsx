type PointTitleProps = {
  name: string;
};

export function PointTitle({ name }: PointTitleProps) {
  return <div className="text-base font-semibold leading-snug">{name}</div>;
}
