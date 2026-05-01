import { NextResponse } from "next/server";

// The container healthcheck hits this endpoint. Keep it self-contained:
// no upstream calls, no DB, no caching — just confirm the Node process is
// answering HTTP. Hitting "/" instead caused Portainer to mark the stack
// unhealthy whenever the Jolpica/OpenF1 APIs were slow, since SSR on the
// dashboard fans out to those services and can exceed the healthcheck's
// 5s timeout.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json({ status: "ok" });
}

export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
