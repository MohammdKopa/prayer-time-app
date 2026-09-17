// Compass angle maths.
//
// Two problems make a naive compass arrow unusable, and both are here rather
// than in the screen so they can be reasoned about on their own.
//
// 1. WRAP. Bearings live on a circle but a rotation style is a plain number.
//    Going from 359 to 1 is a two-degree turn, but naively it is a -358 degree
//    one, and the arrow visibly spins all the way round. Fixing it means
//    keeping an UNWRAPPED angle that may grow past 360 or below 0, and only
//    ever moving it by the short way round.
//
// 2. NOISE. A magnetometer jitters by a few degrees constantly. Fed straight
//    to the view, the arrow twitches even on a table. A low-pass filter trades
//    a little lag for a needle that holds still.

/** Shortest signed turn from `from` to `to`, always within [-180, 180]. */
export function shortestTurn(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

/** Smallest absolute angle between two bearings, within [0, 180]. */
export function angleBetween(a: number, b: number): number {
  return Math.abs(shortestTurn(a, b));
}

/**
 * Advance an unwrapped angle towards a new target the short way round, with
 * exponential smoothing.
 *
 * `smoothing` is how much of the remaining turn to take per update: 1 snaps
 * instantly, 0 never moves. 0.15 at the ~30Hz a heading sensor reports settles
 * in well under a second while absorbing the jitter.
 */
export function approachAngle(
  unwrapped: number,
  target: number,
  smoothing = 0.15,
): number {
  return unwrapped + shortestTurn(unwrapped, target) * smoothing;
}

/** True when the phone is pointed close enough to call it aligned. */
export function isAligned(
  heading: number,
  target: number,
  toleranceDeg = 5,
): boolean {
  return angleBetween(heading, target) <= toleranceDeg;
}
