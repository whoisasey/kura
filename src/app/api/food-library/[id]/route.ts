import { createClient } from "@/lib/supabase/server";

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as unknown;

  const { data, error } = await supabase
    .from("food_library")
    .update(body as Record<string, unknown>)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: "update_failed" }, { status: 500 });
  }

  return Response.json(data);
};
