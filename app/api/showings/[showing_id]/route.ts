import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/showings/[showing_id] - Get a single showing
export async function GET(_req: NextRequest, context: any) {
  try {
    const params = context.params;
    const showing = await prisma.showing.findUnique({
      where: { showing_id: Number(params.showing_id) },
    });
    if (!showing) return NextResponse.json({ error: "Showing not found" }, { status: 404 });
    const showingSerialized = {
      ...showing,
      showing_id: showing.showing_id.toString(),
      movie_id: showing.movie_id.toString(),
      theater_id: showing.theater_id.toString(),
    };
    return NextResponse.json(showingSerialized);
  } catch (error) {
    console.error("/api/showings/[showing_id] GET error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT /api/showings/[showing_id] - Update a showing
export async function PUT(req: NextRequest, context: any) {
  try {
    const params = context.params;
    const body = await req.json();
    const showing = await prisma.showing.update({
      where: { showing_id: Number(params.showing_id) },
      data: {
        movie_id: Number(body.movie_id),
        theater_id: Number(body.theater_id),
        show_time: new Date(body.show_time),
        available_seats: body.available_seats,
        status: body.status ?? true,
      },
    });
    const showingSerialized = {
      ...showing,
      showing_id: showing.showing_id.toString(),
      movie_id: showing.movie_id.toString(),
      theater_id: showing.theater_id.toString(),
    };
    return NextResponse.json(showingSerialized);
  } catch (error) {
    console.error("/api/showings/[showing_id] PUT error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/showings/[showing_id] - Soft delete a showing
export async function DELETE(_req: NextRequest, context: any) {
  try {
    const params = context.params;
    const showing = await prisma.showing.update({
      where: { showing_id: Number(params.showing_id) },
      data: { status: false },
    });
    const showingSerialized = {
      ...showing,
      showing_id: showing.showing_id.toString(),
      movie_id: showing.movie_id.toString(),
      theater_id: showing.theater_id.toString(),
    };
    return NextResponse.json(showingSerialized);
  } catch (error) {
    console.error("/api/showings/[showing_id] DELETE error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
