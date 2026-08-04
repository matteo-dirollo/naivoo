import { neon } from "@neondatabase/serverless";
import { Trip, TripMarker } from "@/types/type";

// NOTE: sql.transaction([...queries]) requires a reasonably recent version
// of @neondatabase/serverless. Check your installed version's docs if this
// throws a "transaction is not a function" error — older versions expect
// sql.transaction((txn) => [...]) instead of a plain array. Run
// `npm ls @neondatabase/serverless` to check, and update if needed.

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Trip & {
      stops?: Omit<TripMarker, "trip_id">[];
    };
    const { name, trip_id, user_id, start_location, return_to_start, stops } =
      body;

    if (!user_id || !start_location) {
      return Response.json(
        { error: "Missing or invalid start_location" },
        { status: 400 },
      );
    }

    if (!trip_id) {
      return Response.json({ error: "trip_id is required" }, { status: 400 });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return Response.json(
        { error: "Database URL not configured" },
        { status: 500 },
      );
    }

    const sql = neon(dbUrl);

    // ── Idempotency guard ──────────────────────────────────────────────
    // trip_id is generated client-side (getShortBase36Id), so if a
    // previous request actually succeeded on the server but the client
    // never saw the response (timeout, dropped connection, flaky tunnel),
    // a retry with the same trip_id would previously hit a duplicate-key
    // error or silently create orphaned data. Instead, detect that case
    // and just return what already exists.
    const existing = await sql`
      SELECT trip_id FROM trips WHERE trip_id = ${trip_id};
    `;

    if (existing.length > 0) {
      const [existingTrip] = await sql`
        SELECT * FROM trips WHERE trip_id = ${trip_id};
      `;
      const existingStops = await sql`
        SELECT
          stop_id,
          trip_id,
          location,
          expected_duration,
          expected_distance,
          isuserlocation::boolean AS "isUserLocation"
        FROM trip_stops
        WHERE trip_id = ${trip_id};
      `;

      return Response.json(
        {
          data: { ...existingTrip, stops: existingStops },
          deduped: true,
        },
        { status: 200 },
      );
    }

    // ── Build both inserts, but don't await them individually ──────────
    // Passing un-awaited query objects into sql.transaction() runs them
    // as a single atomic round trip: either both the trip row and all
    // stop rows are written, or neither is. This is what prevents the
    // "trip exists with zero stops" scenario that was crashing the app
    // on next launch.
    const tripInsert = sql`
      INSERT INTO trips (
        name,
        trip_id,
        user_id,
        start_location,
        return_to_start,
        active_trip
      ) VALUES (
                 ${name},
                 ${trip_id},
                 ${user_id},
                 ${JSON.stringify(start_location)},
                 ${return_to_start ?? false},
                 true
               )
        RETURNING *;
    `;

    const hasStops = !!stops && stops.length > 0;

    let createdTrip: any;
    let createdStops: any[] = [];

    try {
      if (hasStops) {
        const params: any[] = [];
        const placeholders = stops!
          .map((stop, i) => {
            const idx = i * 6;
            params.push(
              stop.stop_id,
              trip_id,
              JSON.stringify(stop.location),
              stop.expected_duration ?? 0,
              stop.expected_distance ?? 0,
              stop.isUserLocation ?? false,
            );
            return `($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6})`;
          })
          .join(", ");

        const stopsQueryText = `
          INSERT INTO trip_stops (
            stop_id,
            trip_id,
            location,
            expected_duration,
            expected_distance,
            isuserlocation
          ) VALUES ${placeholders}
          RETURNING
            stop_id,
            trip_id,
            location,
            expected_duration,
            expected_distance,
            isuserlocation::boolean AS "isUserLocation";
        `;

        // sql.query(...) is built inline here, as a direct array element,
        // rather than assigned to an intermediate variable first. Doing it
        // this way lets TypeScript resolve the ArrayMode/FullResults
        // generics to their literal `false` defaults, which is what
        // sql.transaction() requires. Pulling it out into a
        // separately-typed variable (e.g. via ReturnType<typeof sql.query>)
        // widens those generics to `boolean` and breaks the overload match.
        const [tripRows, stopRows] = await sql.transaction([
          tripInsert,
          sql.query(stopsQueryText, params),
        ]);
        createdTrip = (tripRows as any[])[0];
        createdStops = stopRows as any[];
      } else {
        const [tripRows] = await sql.transaction([tripInsert]);
        createdTrip = (tripRows as any[])[0];
      }
    } catch (txnError) {
      // Nothing was committed — no orphaned trip, no orphaned stops.
      console.error("Trip creation transaction failed:", txnError);
      return Response.json(
        { error: "Failed to create trip and stops together" },
        { status: 500 },
      );
    }

    return Response.json(
      {
        data: {
          ...createdTrip,
          stops: createdStops,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating trip:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
