type ClipPathOptions = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const roundPercentage = (value: number) => Math.round(value * 1e6) / 1e6;

export const getClipPath = ({ height, width, x, y }: ClipPathOptions) => {
  const endRadius = Math.hypot(
    Math.max(x, width - x + 200),
    Math.max(y, height - y + 200),
  );
  const normalizedDiagonal = Math.hypot(width, height) / Math.SQRT2;
  const xPercentage = roundPercentage((x / width) * 100);
  const yPercentage = roundPercentage((y / height) * 100);
  const endRadiusPercentage = roundPercentage(
    (endRadius / normalizedDiagonal) * 100,
  );

  return [
    `circle(0% at ${xPercentage}% ${yPercentage}%)`,
    `circle(${endRadiusPercentage}% at ${xPercentage}% ${yPercentage}%)`,
  ];
};
