export function getOffsetMinutes(input: {
  offsetConfig?: {
    preset?: string;
    customMinutes?: number;
  };
}): number {
  const config = input.offsetConfig;
  if (!config) return 60;
  return (
    config.customMinutes ||
    (config.preset === "30min"
      ? 30
      : config.preset === "1hour"
        ? 60
        : config.preset === "2hours"
          ? 120
          : config.preset === "4hours"
            ? 240
            : config.preset === "6hours"
              ? 360
              : config.preset === "12hours"
                ? 720
                : 60)
  );
}
