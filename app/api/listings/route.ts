import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import type { Category, Status } from "@/lib/data";

function toListing(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    category: row.category as Category,
    subcategory: row.subcategory,
    description: row.description,
    date: row.date ?? undefined,
    time: row.time ?? undefined,
    location: row.location,
    city: row.city,
    state: row.state,
    cost: row.cost,
    seniorDiscount: row.senior_discount ?? false,
    contact: row.contact ?? undefined,
    url: row.url ?? undefined,
    tags: row.tags ?? [],
    status: row.status as Status,
    submittedBy: row.submitted_by as "curator" | "community",
    createdAt: row.created_at,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const sb = getServiceClient();
  let query = sb.from("listings").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map(toListing));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sb = getServiceClient();

  const row = {
    id: `listing-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: body.title,
    category: body.category,
    subcategory: body.subcategory,
    description: body.description,
    date: body.date || null,
    time: body.time || null,
    location: body.location,
    city: body.city,
    state: body.state || "CT",
    cost: body.cost,
    senior_discount: body.seniorDiscount ?? false,
    contact: body.contact || null,
    url: body.url || null,
    tags: body.tags ?? [],
    status: body.status ?? "pending",
    submitted_by: body.submittedBy ?? "community",
  };

  const { data, error } = await sb.from("listings").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toListing(data));
}
