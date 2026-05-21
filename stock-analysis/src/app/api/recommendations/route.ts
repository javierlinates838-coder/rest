import { NextResponse } from "next/server";
import { getStockRecommendations } from "@/lib/stock-recommendations";

export const maxDuration = 60;

export async function GET() {
  try {
    const data = await getStockRecommendations();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
