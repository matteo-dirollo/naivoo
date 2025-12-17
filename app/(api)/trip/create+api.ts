import { neon } from "@neondatabase/serverless";
import { Trip, TripMarker } from "@/types/type";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Trip & {
      stops?: Omit<TripMarker, "trip_id">[];
    };
    const { name, trip_id, user_id, start_location, return_to_start, stops } =
      body;

    if (!user_id || !start_location) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid start_location" }),
        { status: 400 },
      );
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return new Response(
        JSON.stringify({ error: "Database URL not configured" }),
        { status: 500 },
      );
    }

    const sql = neon(dbUrl);

    // Insert the trip
    const [createdTrip] = await sql`
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

    let createdStops: any[] = [];

    if (stops && stops.length > 0) {
      // flatten params & generate placeholders
      const params: any[] = [];
      const placeholders = stops
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

      // perform multi-row insert via sql.query()
      const stopsQuery = `
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

      createdStops = await sql.query(stopsQuery, params);
    }

    return new Response(
      JSON.stringify({
        data: {
          ...createdTrip,
          stops: createdStops,
        },
      }),
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating trip:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
