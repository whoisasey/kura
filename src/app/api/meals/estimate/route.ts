import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

interface EstimateRequest {
  image?: string;
  text?: string;
  type: "meal" | "label" | "describe";
}

interface EstimateResult {
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  weight_g?: number;
  servingSize?: string;
}

const MACRO_JSON_PROMPT =
  "Respond with JSON only: { name, description, calories, protein_g, carbs_g, fat_g, weight_g }. " +
  "'name' must be a short human-readable label (e.g. 'Toast', '2 scrambled eggs', 'Miso chicken') — max 4 words. " +
  "'description' is a one-sentence summary. " +
  "'weight_g' is the estimated serving weight in grams (use the user's stated weight if given, otherwise estimate). " +
  "Be conservative with calorie estimates.";

export const POST = async (request: Request): Promise<Response> => {
  const body = (await request.json()) as unknown;
  const { image, text, type } = body as EstimateRequest;

  if (!type || (type !== "describe" && !image)) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  let raw: string;

  try {
    if (type === "describe") {
      if (!text) return Response.json({ error: "missing_fields" }, { status: 400 });

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `The user has: "${text}". Estimate the nutritional content. ${MACRO_JSON_PROMPT}`,
          },
        ],
      });
      raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    } else {
      const prompt =
        type === "meal"
          ? `Analyze this meal photo. Estimate the nutritional content. ${MACRO_JSON_PROMPT}`
          : "Read this nutrition label. Extract the per-serving data. Respond with JSON only: { product_name, serving_size, calories, protein_g, carbs_g, fat_g }. Use the serving size as shown.";

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
                  data: image!,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      });
      raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    }
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
    type === "label"
      ? {
          name: String(parsed.product_name ?? ""),
          description: String(parsed.product_name ?? ""),
          calories: Number(parsed.calories ?? 0),
          protein: Number(parsed.protein_g ?? 0),
          carbs: Number(parsed.carbs_g ?? 0),
          fat: Number(parsed.fat_g ?? 0),
          servingSize: String(parsed.serving_size ?? ""),
        }
      : {
          name: String(parsed.name ?? parsed.description ?? ""),
          description: String(parsed.description ?? ""),
          calories: Number(parsed.calories ?? 0),
          protein: Number(parsed.protein_g ?? 0),
          carbs: Number(parsed.carbs_g ?? 0),
          fat: Number(parsed.fat_g ?? 0),
          weight_g: parsed.weight_g ? Number(parsed.weight_g) : 0,
        };

  return Response.json(result);
};
