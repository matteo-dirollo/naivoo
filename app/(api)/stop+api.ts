import { neon } from "@neondatabase/serverless";
import { TripMarker } from "@/types/type";

// POST: Create a new stop for a trip
export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { trip_id, address, latitude, longitude } =
      (await request.json()) as TripMarker;

    if (!trip_id || !address) {
      return Response.json(
        { error: "Missing required fields: trip_id and address" },
        { status: 400 },
      );
    }

    const [newStop] = await sql`
      INSERT INTO trip_stops (trip_id, address, latitude, longitude)
      VALUES (${trip_id}, ${address}, ${latitude}, ${longitude})
        RETURNING *;
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
    const { stop_id, address, latitude, longitude } =
      (await request.json()) as Partial<TripMarker>;

    if (!stop_id) {
      return Response.json(
        { error: "stop_id is required for updates" },
        { status: 400 },
      );
    }

    const [updatedStop] = await sql`
      UPDATE trip_stops
      SET
        address = COALESCE(${address}, address),
        latitude = COALESCE(${latitude}, latitude),
        longitude = COALESCE(${longitude}, longitude)
      WHERE stop_id = ${stop_id}
        RETURNING *;
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
