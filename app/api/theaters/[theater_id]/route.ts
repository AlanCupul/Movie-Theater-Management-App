import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/theaters/[theater_id]
export async function GET(_req: NextRequest, context: any) {
  try {
    const params = (await context).params;
    const theater = await prisma.theater.findUnique({
      where: { theater_id: Number(params.theater_id) },
    });
    if (!theater) return NextResponse.json({ error: "Theater not found" }, { status: 404 });
    const theaterSerialized = {
      ...theater,
      theater_id: theater.theater_id.toString(),
      seat_capacity: theater.seat_capacity,
      theater_number: theater.theater_number,
      status: theater.status,
    };
    return NextResponse.json(theaterSerialized);
  } catch (error) {
    console.error("/api/theaters/[theater_id] GET error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT /api/theaters/[theater_id]
export async function PUT(req: NextRequest, context: any) {
  try {
    const params = (await context).params;
    const body = await req.json();
    const theater = await prisma.theater.update({
      where: { theater_id: Number(params.theater_id) },
      data: {
        theater_number: body.theater_number,
        seat_capacity: body.seat_capacity,
        status: body.status ?? true,
      },
    });
    const theaterSerialized = {
      ...theater,
      theater_id: theater.theater_id.toString(),
      seat_capacity: theater.seat_capacity,
      theater_number: theater.theater_number,
      status: theater.status,
    };
    return NextResponse.json(theaterSerialized);
  } catch (error) {
    console.error("/api/theaters/[theater_id] PUT error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/theaters/[theater_id]
export async function DELETE(_req: NextRequest, context: any) {
  try {
    const params = (await context).params;
    const theater = await prisma.theater.update({
      where: { theater_id: Number(params.theater_id) },
      data: { status: false },
    });
    const theaterSerialized = {
      ...theater,
      theater_id: theater.theater_id.toString(),
      seat_capacity: theater.seat_capacity,
      theater_number: theater.theater_number,
      status: theater.status,
    };
    return NextResponse.json(theaterSerialized);
  } catch (error) {
    console.error("/api/theaters/[theater_id] DELETE error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
