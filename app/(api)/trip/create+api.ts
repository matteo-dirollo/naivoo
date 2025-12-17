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
      return Response.json(
        { error: "Missing or invalid start_location" },
        { status: 400 },
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Create trip
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

    // Create stops if provided
    let createdStops: any = [];
    if (stops && stops.length > 0) {
      const stopValues = stops.map(
        (stop) => sql`(
        ${stop.stop_id},
        ${trip_id},
        ${JSON.stringify(stop.location)},
        ${stop.expected_duration || 0},
        ${stop.expected_distance || 0},
        ${stop.isUserLocation ?? false}
      )`,
      );

      createdStops = await sql`
        INSERT INTO trip_stops (
          stop_id,
          trip_id,
          location,
          expected_duration,
          expected_distance,
          isuserlocation
        )
        VALUES ${sql(stopValues)}
        RETURNING 
          stop_id,
          trip_id,
          location,
          expected_duration,
          expected_distance,
          isuserlocation::boolean as "isUserLocation";
      `;
    }

    // Return trip with stops
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
