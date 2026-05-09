export function getOffsetMinutes(input: {
  offsetConfig?: {
    preset?: string;
    customMinutes?: number;
  };
}): number {
  const config = input.offsetConfig;
  if (!config) return 60;
  // BUG-FIX: ?? instead of || to allow customMinutes=0; added missing seconds presets
  return (
    config.customMinutes ??
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
                : config.preset === "seconds-30"
                  ? 5
                  : config.preset === "seconds-6"
                    ? 1
                    : 60)
  );
}
