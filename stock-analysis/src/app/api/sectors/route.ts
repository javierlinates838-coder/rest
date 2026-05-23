import { NextResponse } from "next/server";
import { buildSectorPerformanceBoard } from "@/lib/sector-performance";

export const revalidate = 300;

export async function GET() {
  try {
    const board = await buildSectorPerformanceBoard();
    return NextResponse.json({
      sectors: board.sectors,
      estimated: board.estimated,
      source: board.source,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sector data unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
