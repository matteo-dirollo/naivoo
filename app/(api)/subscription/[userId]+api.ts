import { neon } from "@neondatabase/serverless";

export async function GET(request: Request, { userId }: { userId: string }) {
  if (!userId) {
    return Response.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT status, trial_end, current_period_end, cancel_at_period_end
      FROM subscriptions
      WHERE user_id = ${userId};
    `;

    if (result.length === 0) {
      return Response.json({ status: "none" }, { status: 200 });
    }

    const row = result[0];
    return Response.json(
      {
        status: row.status,
        trial_end: row.trial_end,
        current_period_end: row.current_period_end,
        cancel_at_period_end: row.cancel_at_period_end,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
