import { convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { aqiInfo, fetchAirSnapshot, findWindows, hourLabel, windowLabel } from "./aqi";
import { KIND_META, safeThreshold, type Member } from "./family";
import { createResponsesCall } from "./ai/responses.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

/** Largest chat request we accept (bytes); a long conversation is well under this. */
export const MAX_BODY_BYTES = 256 * 1024;
/** Longest single text part (characters) — stops pasted walls of text running up AI cost. */
export const MAX_TEXT_CHARS = 4000;

// Only the parts the client actually sends are checked strictly; other part types
// (reasoning, step markers) pass through untouched but must still carry a `type`.
const partSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string().max(MAX_TEXT_CHARS) }).loose(),
  z.object({ type: z.string().regex(/^(?!text$)[a-z0-9-]+$/) }).loose(),
]);

const messageSchema = z
  .object({
    id: z.string().max(200),
    // "system" is never accepted from the browser: instructions are built on the server only.
    role: z.enum(["user", "assistant"]),
    parts: z.array(partSchema).max(100),
  })
  .loose();

export const bodySchema = z.object({
  threadId: z.string().min(1).max(100),
  messages: z.array(messageSchema).min(1).max(200),
  place: z.object({
    name: z.string().max(200),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  family: z
    .array(
      z.object({
        id: z.string().max(100),
        name: z.string().max(80),
        kind: z.enum(["child", "elderly", "runner", "adult", "asthma"]),
        age: z.number().int().min(0).max(120).optional(),
        notes: z.string().max(500).optional(),
        routines: z
          .array(
            z.object({
              id: z.string().max(100),
              label: z.string().max(80),
              hour: z.number().int().min(0).max(23),
              minutes: z.number().int().min(1).max(600),
              intensity: z.enum(["light", "moderate", "vigorous"]),
              flexible: z.boolean(),
            }),
          )
          .max(20),
      }),
    )
    .max(20),
});

function json(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function friendlyError(error: unknown) {
  const status = (error as { statusCode?: number })?.statusCode;
  if (status === 429)
    return "I'm getting a lot of questions right now — please try again in a moment.";
  if (status === 402)
    return "The AI credits for this app have run out. The app owner can add more in Lovable workspace settings.";
  if (status === 403) return "AI access is currently restricted for this app.";
  return "Something went wrong while I was thinking. Please try again.";
}

export function buildInstructions(
  snapshot: Awaited<ReturnType<typeof fetchAirSnapshot>>,
  family: Member[],
) {
  const c = snapshot.current;
  const info = aqiInfo(c.aqi);
  const now = c.time;
  const next24 = snapshot.hourly
    .slice(0, 24)
    .map(
      (h) =>
        `${h.time.slice(0, 10) === now.slice(0, 10) ? "today" : "tmrw"} ${hourLabel(h.time)}: AQI ${h.aqi}, PM2.5 ${h.pm25}`,
    )
    .join("\n");
  const general = findWindows(snapshot.hourly.slice(0, 24), 100, 1, 3);

  const familyText = family.length
    ? family
        .map((m) => {
          const meta = KIND_META[m.kind];
          const routines = m.routines.length
            ? m.routines
                .map((r) => {
                  const thr = safeThreshold(m.kind, r.intensity);
                  const w = findWindows(
                    snapshot.hourly.slice(0, 24),
                    thr,
                    Math.max(1, Math.ceil(r.minutes / 60)),
                    2,
                  );
                  return `  - ${r.label} (usually ${hourLabel(`2000-01-01T${String(r.hour).padStart(2, "0")}:00`)}, ${r.minutes} min, ${r.intensity}${r.flexible ? ", flexible" : ", fixed time"}). Comfort threshold AQI ≤ ${thr}. ${w.relaxed ? "No hour meets it; cleanest" : "Clean"} windows: ${w.windows.map((x) => `${windowLabel(x, now)} (avg AQI ${x.avgAqi})`).join("; ")}`;
                })
                .join("\n")
            : "  - no routines added";
          return `- ${m.name}: ${meta.label}${m.age ? `, age ${m.age}` : ""}${m.notes ? `. Notes: ${m.notes}` : ""}\n${routines}`;
        })
        .join("\n")
    : "No family members added yet. If relevant, gently suggest adding them on the Family page for tailored advice.";

  return `You are BreatheEasy, a calm, caring family air-quality guide (like a kind family doctor who also understands urban winter smog).

TONE: Warm, reassuring, practical, never alarmist. Avoid scary words like "dangerous" or "toxic" unless AQI > 300. Offer gentle alternatives instead of prohibitions. Keep answers concise (usually under 180 words). Use short markdown: a one-line verdict in bold first, then bullets.

ALWAYS EXPLAIN DIRECT IMPACT: For every recommendation or choice, state its concrete effect, e.g. "Moving play from 6 PM (AQI 210) to 2 PM (AQI 120) means breathing roughly 40% less fine dust", "An N95 filters ~95% of PM2.5", "Taking the metro instead of driving 10 km saves ~1.4 kg CO₂ and ~₹55". Quantify with the live numbers below when possible. Calculate % reductions from PM2.5 values.

SAFETY: You are not a medical professional; for symptoms like breathlessness, chest pain or wheezing that does not settle, kindly advise contacting a doctor. Don't invent data — only use the numbers below.

LIVE AIR DATA for ${snapshot.place} (local time now ${now}, timezone ${snapshot.timezone}; US AQI scale):
Current: AQI ${c.aqi} (${info.label}), PM2.5 ${c.pm25} µg/m³, PM10 ${c.pm10} µg/m³, NO₂ ${c.no2}, O₃ ${c.o3}, temp ${c.temp}°C, humidity ${c.humidity}%, wind ${c.wind} km/h.
Best general windows next 24h (AQI ≤ 100${general.relaxed ? " not reached — these are the cleanest hours" : ""}): ${general.windows.map((w) => `${windowLabel(w, now)} avg AQI ${w.avgAqi}`).join("; ")}
Hourly forecast:
${next24}

FAMILY:
${familyText}`;
}

export async function handleChat(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, "AI is not configured for this app yet.");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json(413, "That conversation is too long. Please start a new one.");

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES)
      return json(413, "That conversation is too long. Please start a new one.");
    body = bodySchema.parse(JSON.parse(raw));
  } catch {
    return json(400, "That message couldn't be read. Please try again.");
  }

  let snapshot;
  try {
    snapshot = await fetchAirSnapshot(body.place);
  } catch {
    return json(503, "I couldn't reach the live air quality service. Please try again shortly.");
  }

  // Shape checked above; the AI SDK's own converter validates the part details.
  const messages = body.messages as UIMessage[];
  const modelMessages = await convertToModelMessages(messages);
  const call = createResponsesCall(
    request,
    { baseURL: GATEWAY_URL, apiKey, model: MODEL },
    modelMessages,
    buildInstructions(snapshot, body.family),
  );
  return call.response(messages, (error) => {
    console.error("chat error", error);
    return friendlyError(error);
  });
}
