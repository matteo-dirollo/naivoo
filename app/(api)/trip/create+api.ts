import { neon } from "@neondatabase/serverless";
import { Trip } from "@/types/type";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Trip;
    const { name, trip_id, user_id, start_location, return_to_start } = body;

    if (
      !user_id ||
      !start_location ||
      !start_location.address ||
      start_location.latitude == null ||
      start_location.longitude == null
    ) {
      return Response.json(
        { error: "Missing or invalid start_location" },
        { status: 400 },
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

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
        ${return_to_start},
        true
      )
      RETURNING *;
    `;

    return Response.json({ data: createdTrip }, { status: 201 });
  } catch (error) {
    console.error("Error creating trip:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
