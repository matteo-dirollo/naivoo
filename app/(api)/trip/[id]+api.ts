import { neon } from "@neondatabase/serverless";

export async function GET(request: Request, { id }: { id: string }) {
  const userId = id;

  if (!userId) {
    return Response.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const trips = await sql`
      SELECT
        t.trip_id,
        t.user_id,
        t.name,
        t.start_location,
        t.return_to_start,
        t.optimized_order,
        t.total_distance_km,
        t.total_duration_min,
        t.active_trip,
        t.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'stop_id', ts.stop_id,
              'trip_id', ts.trip_id,
              'location', ts.location,
              'expected_duration', ts.expected_duration,
              'expected_distance', ts.expected_distance,
              'isUserLocation', ts.isuserlocation
            )
              ORDER BY ts.stop_id
          ) FILTER (WHERE ts.stop_id IS NOT NULL),
          '[]'::json
        ) AS stops
      FROM trips t
             LEFT JOIN trip_stops ts ON ts.trip_id = t.trip_id
      WHERE t.user_id = ${userId}
      GROUP BY t.trip_id
      ORDER BY t.created_at DESC;
    `;

    console.log("Trips fetched successfully:", trips.length);
    return Response.json({ data: trips }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching trips - Full error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Return more detailed error in development
    return Response.json(
      {
        error: "Internal Server Error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  const tripId = id;

  if (!tripId) {
    return Response.json({ error: "Trip ID is required" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();

    const {
      total_distance_km,
      total_duration_min,
      optimized_order,
      active_trip,
    } = body;

    const [updatedTrip] = await sql`
      UPDATE trips
      SET
        total_distance_km = COALESCE(${total_distance_km}, total_distance_km),
        total_duration_min = COALESCE(${total_duration_min}, total_duration_min),
        optimized_order = COALESCE(${optimized_order}, optimized_order),
        active_trip = COALESCE(${active_trip}, active_trip)
      WHERE trip_id = ${tripId}
        RETURNING *;
    `;

    if (!updatedTrip) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }

    return Response.json({ data: updatedTrip }, { status: 200 });
  } catch (error) {
    console.error("Error updating trip:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE a specific trip by trip_id
 */
export async function DELETE(request: Request, { id }: { id: string }) {
  const tripId = id;

  if (!tripId) {
    return Response.json({ error: "Trip ID is required" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      DELETE FROM trips
      WHERE trip_id = ${tripId}
        RETURNING trip_id;
    `;

    if (result.length === 0) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }

    return Response.json(
      { message: "Trip deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting trip:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
