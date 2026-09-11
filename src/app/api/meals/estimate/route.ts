import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface EstimateRequest {
  image: string;
  type: "meal" | "label";
}

interface EstimateResult {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize?: string;
}

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json()) as unknown;

  const { image, type } = body as EstimateRequest;

  if (!image || !type) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  const prompt =
    type === "meal"
      ? "Analyze this meal photo. Estimate the nutritional content. Respond with JSON only: { name, description, calories, protein_g, carbs_g, fat_g }. 'name' must be a short human-readable label (e.g. 'Toast', '2 scrambled eggs', 'Miso chicken') — max 4 words, no filler adjectives like 'toasted' or 'pan-cooked'. 'description' is a brief visual description of what you see. Be conservative with estimates."
      : "Read this nutrition label. Extract the per-serving data. Respond with JSON only: { product_name, serving_size, calories, protein_g, carbs_g, fat_g }. Use the serving size as shown.";

  let raw: string;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    raw = message.content[0].type === "text" ? message.content[0].text : "{}";
  } catch (err) {
    console.error("[meals/estimate] Claude call failed:", err);
    return Response.json({ error: "estimate_failed" }, { status: 500 });
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "parse_failed" }, { status: 500 });
  }

  const result: EstimateResult =
    type === "meal"
      ? {
          name: String(parsed.name ?? parsed.description ?? ""),
          description: String(parsed.description ?? ""),
          calories: Number(parsed.calories ?? 0),
          protein: Number(parsed.protein_g ?? 0),
          carbs: Number(parsed.carbs_g ?? 0),
          fat: Number(parsed.fat_g ?? 0),
        }
      : {
          name: String(parsed.product_name ?? ""),
          description: String(parsed.product_name ?? ""),
          calories: Number(parsed.calories ?? 0),
          protein: Number(parsed.protein_g ?? 0),
          carbs: Number(parsed.carbs_g ?? 0),
          fat: Number(parsed.fat_g ?? 0),
          servingSize: String(parsed.serving_size ?? ""),
        };

  return Response.json(result);
};
