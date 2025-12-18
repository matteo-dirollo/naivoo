import { neon } from "@neondatabase/serverless";

// POST: Create a new stop for a trip
export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const {
      stop_id,
      trip_id,
      location,
      expected_duration,
      expected_distance,
      isUserLocation,
    } = await request.json();

    if (!stop_id || !trip_id || !location) {
      return Response.json(
        {
          error:
            "Missing required fields: stop_id, trip_id, and location with address",
        },
        { status: 400 },
      );
    }
    // Check if a stop with the same address already exists for this trip
    const existingStops = await sql`
      SELECT stop_id, location
      FROM trip_stops
      WHERE trip_id = ${trip_id}
        AND location->>'address' = ${location.address};
    `;

    if (existingStops.length > 0) {
      // Duplicate found - return null data to indicate no creation
      return Response.json(
        {
          data: null,
          message: "Stop with this address already exists in the trip",
        },
        { status: 200 },
      );
    }

    const [newStop] = await sql`
            INSERT INTO trip_stops (
                stop_id,
                trip_id,
                location,
                expected_duration,
                expected_distance,
                isuserlocation
            )
            VALUES (
                       ${stop_id},
                       ${trip_id},
                       ${JSON.stringify(location)},
                       ${expected_duration || 0},
                       ${expected_distance || 0},
                       ${isUserLocation ?? false}
                   )
                RETURNING 
        stop_id,
        trip_id,
        location,
        expected_duration,
        expected_distance,
        isuserlocation::boolean as "isUserLocation";
        `;

    return Response.json({ data: newStop }, { status: 201 });
  } catch (error) {
    console.error("Error creating stop:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update an existing stop
export async function PUT(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { stop_id, location, expected_duration, expected_distance } =
      await request.json();

    if (!stop_id) {
      return Response.json(
        { error: "stop_id is required for updates" },
        { status: 400 },
      );
    }

    const [updatedStop] = await sql`
            UPDATE trip_stops
            SET
                location = COALESCE(${location ? JSON.stringify(location) : null}, location),
                expected_duration = COALESCE(${expected_duration}, expected_duration),
                expected_distance = COALESCE(${expected_distance}, expected_distance)
            WHERE stop_id = ${stop_id}
                RETURNING 
        stop_id,
        trip_id,
        location,
        expected_duration,
        expected_distance,
        isuserlocation::boolean as "isUserLocation";
        `;

    if (!updatedStop) {
      return Response.json({ error: "Stop not found" }, { status: 404 });
    }

    return Response.json({ data: updatedStop }, { status: 200 });
  } catch (error) {
    console.error("Error updating stop:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove a stop
export async function DELETE(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { stop_id } = await request.json();

    if (!stop_id) {
      return Response.json(
        { error: "stop_id is required for deletion" },
        { status: 400 },
      );
    }

    const result = await sql`
            DELETE FROM trip_stops WHERE stop_id = ${stop_id} RETURNING stop_id;
        `;

    if (result.length === 0) {
      return Response.json({ error: "Stop not found" }, { status: 404 });
    }

    return Response.json(
      { message: "Stop deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting stop:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
