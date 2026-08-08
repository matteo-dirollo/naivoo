// app/(api)/clerk/webhook+api.ts
import { Webhook } from "svix";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!webhookSecret || !svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: any;

  try {
    event = new Webhook(webhookSecret).verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("Clerk webhook signature verification failed:", err);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "session.created") {
    const { user_id: userId, id: newSessionId } = event.data;
    try {
      const sessions = await clerkClient.sessions.getSessionList({
        userId,
        status: "active",
      });
      await Promise.all(
        sessions.data
          .filter((s) => s.id !== newSessionId)
          .map((s) => clerkClient.sessions.revokeSession(s.id)),
      );
    } catch (err) {
      console.error("Failed to enforce single-device session:", err);
    }
  }

  return Response.json({ received: true }, { status: 200 });
}
