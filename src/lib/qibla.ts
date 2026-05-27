import { Coordinates, Qibla } from "adhan";

/** Bearing in degrees from true north (clockwise) to the Kaaba in Mecca. */
export function qiblaBearing(latitude: number, longitude: number): number {
  return Qibla(new Coordinates(latitude, longitude));
}

/** Convert a numeric bearing to a compass label like "شمال شرق" (north-east). */
export function bearingLabelAr(bearing: number): string {
  const sectors = [
    { from: 337.5, to: 360, label: "شمال" },
    { from: 0, to: 22.5, label: "شمال" },
    { from: 22.5, to: 67.5, label: "شمال شرق" },
    { from: 67.5, to: 112.5, label: "شرق" },
    { from: 112.5, to: 157.5, label: "جنوب شرق" },
    { from: 157.5, to: 202.5, label: "جنوب" },
    { from: 202.5, to: 247.5, label: "جنوب غرب" },
    { from: 247.5, to: 292.5, label: "غرب" },
    { from: 292.5, to: 337.5, label: "شمال غرب" },
  ];
  const b = ((bearing % 360) + 360) % 360;
  const match = sectors.find((s) => b >= s.from && b < s.to);
  return match?.label ?? "—";
}
