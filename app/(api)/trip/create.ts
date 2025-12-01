import { neon } from "@neondatabase/serverless";
import { Trip } from "@/types/type";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Trip;
    const {
      user_id,
      start_address,
      start_latitude,
      start_longitude,
      return_to_start,
    } = body;

    if (!user_id || !start_address) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Insert only the main trip record. Stops will be handled by a separate endpoint.
    const [createdTrip] = await sql`
      INSERT INTO trips (
        user_id,
        start_address,
        start_latitude,
        start_longitude,
        return_to_start,
        active_trip
      ) VALUES (
        ${Number(user_id)},
        ${start_address},
        ${start_latitude},
        ${start_longitude},
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
