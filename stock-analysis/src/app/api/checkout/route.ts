import { NextRequest, NextResponse } from "next/server";

/** Checkout disabled while building the product */
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
}
