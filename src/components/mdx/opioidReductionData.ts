/**
 * Monthly results from the SAS Visual Analytics tool, read off the dashboard screenshots.
 * Values are by discharge month.
 */

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `count` consecutive months starting at `year`-`month` (1-based month). */
export function monthRange(year: number, month: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const m = (month - 1 + i) % 12;
    const y = year + Math.floor((month - 1 + i) / 12);
    return { long: `${monthNames[m]} ${y}`, short: `${monthNames[m]} '${String(y).slice(2)}` };
  });
}

/** Average morphine equivalents (mg) in the first and last 24 hours of the stay. */
export const meAdmissionDischarge = {
  months: monthRange(2021, 1, 5),
  admission: [35.9, 46.9, 37.7, 36.6, 39.9],
  discharge: [24.9, 34.4, 30.9, 23.8, 24.8],
};

/** Percent change in morphine equivalents from admission to discharge, Jan 2021 – Sep 2022. */
export const mePercentChange = {
  months: monthRange(2021, 1, 21),
  percentChange: [
    -30.6, -26.6, -18.0, -34.9, -37.8, -31.6, -21.3, -48.8, -63.0, -65.8, -61.6, -52.5,
    -65.7, -51.6, -64.0, -61.9, -54.5, -57.6, -59.1, -60.8, -53.9,
  ],
  patients: [43, 70, 62, 66, 56, 62, 62, 49, 45, 64, 60, 66, 54, 49, 65, 83, 83, 96, 91, 86, 89],
  /** Index of July 2021, when the tool went live. */
  launchIndex: 6,
};
