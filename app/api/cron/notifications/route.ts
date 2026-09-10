import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runReminderScan } from "@/lib/notifications/reminders";

/**
 * Meant to be called periodically (e.g. hourly) by the deployer's own
 * crontab or host scheduler — there's no in-app job runner. Protected by a
 * shared secret rather than session auth since nothing signs in to call it.
 */
export async function POST(request: NextRequest) {
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET ist nicht konfiguriert." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runReminderScan();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Reminder scan failed", error);
    return NextResponse.json({ error: "Reminder scan failed" }, { status: 500 });
  }
}
