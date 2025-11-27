import { neon } from "@neondatabase/serverless";

export async function GET(request: Request, { id }: { id: string }) {
    if (!id)
        return Response.json({ error: "Missing required fields" }, { status: 400 });

    try {
        const sql = neon(`${process.env.DATABASE_URL}`);
        const response = await sql`
            SELECT
                trips.trip_id,
                trips.user_id,
                trips.user_name,
                trips.start_address,
                trips.start_latitude,
                trips.start_longitude,
                trips.return_to_start,
                trips.optimized_order,
                trips.total_distance_km,
                trips.total_duration_min,
                trips.active_trip,
                trips.created_at,
                json_agg(
                        json_build_object(
                                'stop_id', stops.stop_id,
                                'trip_id', stops.trip_id,
                                'address', stops.address,
                                'latitude', stops.latitude,
                                'longitude', stops.longitude,
                                'expected_duration', stops.expected_duration,
                                'expected_distance', stops.expected_distance
                        )
                ) AS stops
            FROM
                trips
                    LEFT JOIN
                stops ON stops.trip_id = trips.trip_id
            WHERE
                trips.user_id = ${id}
            GROUP BY
                trips.trip_id
            ORDER BY
                trips.created_at DESC;
        `;

        return Response.json({ data: response });
    } catch (error) {
        console.error("Error fetching recent routes:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
