// Sanity-check endpoint — fetches Aladhan MWL prayer times for the requested
// location and today's date, returns timings as HH:MM strings (the original
// Aladhan response shape) so the client can diff against its local Meeus
// computation. Cached for 1 hour. Not the source of truth — purely a watchdog.

import { NextRequest } from "next/server";

export const revalidate = 3600; // cache the route's outer fetch for 1h

interface AladhanResponse {
  data: {
    timings: Record<string, string>;
    date: { gregorian: { date: string } };
  };
}

function fmtDateForAladhan(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json(
      { error: "lat and lng required as numeric query params" },
      { status: 400 },
    );
  }

  const dateStr = fmtDateForAladhan(new Date());
  // latitudeAdjustmentMethod=2 = one-seventh of the night, matching the local
  // engine's HighLatitudeRule.SeventhOfTheNight (the imam's "easier" ruling).
  const aladhanUrl = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=3&school=0&latitudeAdjustmentMethod=2`;

  try {
    const res = await fetch(aladhanUrl, {
      // Inner fetch cached for 1 hour
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return Response.json(
        { error: `Aladhan responded with ${res.status}` },
        { status: 502 },
      );
    }
    const json = (await res.json()) as AladhanResponse;
    return Response.json({
      timings: json.data.timings,
      dateUsed: json.data.date.gregorian.date,
      source: "aladhan-mwl-seventh-of-night",
    });
  } catch (err) {
    return Response.json(
      { error: `Aladhan fetch failed: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}
