import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sb = getServiceClient();

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.title !== undefined) updates.title = body.title;
  if (body.category !== undefined) updates.category = body.category;
  if (body.subcategory !== undefined) updates.subcategory = body.subcategory;
  if (body.description !== undefined) updates.description = body.description;
  if (body.date !== undefined) updates.date = body.date || null;
  if (body.time !== undefined) updates.time = body.time || null;
  if (body.timeEnd !== undefined) updates.time_end = body.timeEnd || null;
  if (body.location !== undefined) updates.location = body.location;
  if (body.city !== undefined) updates.city = body.city;
  if (body.cost !== undefined) updates.cost = body.cost;
  if (body.organizer !== undefined) updates.organizer = body.organizer || null;
  if (body.ageRange !== undefined) updates.age_range = body.ageRange || null;
  if (body.contact !== undefined) updates.contact = body.contact || null;
  if (body.url !== undefined) updates.url = body.url || null;
  if (body.seniorDiscount !== undefined) updates.senior_discount = body.seniorDiscount;
  if (body.recurring !== undefined) updates.recurring = body.recurring;
  if (body.recurringDay !== undefined) updates.recurring_day = body.recurringDay || null;
  if (body.recurringEnd !== undefined) updates.recurring_end = body.recurringEnd || null;

  const { error } = await sb.from("listings").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = getServiceClient();
  const { error } = await sb.from("listings").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
