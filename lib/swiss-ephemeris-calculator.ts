export const createSwissEphemerisCalculator = (config: any) => {
  return {
    initialize: () => Promise.resolve(),
    calculateChartData: (date: any, lat: any, lon: any, tz: any) => Promise.resolve({ success: true, data: {} }),
  };
};