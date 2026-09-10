import { createClient } from "@/lib/supabase/server";

export const GET = async (): Promise<Response> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("food_library")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) {
    return Response.json({ error: "fetch_failed" }, { status: 500 });
  }

  return Response.json(data ?? []);
};

export const POST = async (request: Request): Promise<Response> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as unknown;

  const { data, error } = await supabase
    .from("food_library")
    .insert({ ...(body as Record<string, unknown>), user_id: user.id })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "create_failed" }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
};
