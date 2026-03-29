import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// AI PROVIDER LAYER (Groq + OpenRouter with fallback)
// ============================================================================

const cleanJSON = (text: string): string => {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return text;
    let jsonPart = text.substring(firstBrace, lastBrace + 1);
    jsonPart = jsonPart.replace(/,\s*([\]}])/g, '$1');
    return jsonPart;
  } catch {
    return text;
  }
};

async function callGroq(
  sys: string,
  p: string,
  timeout: number,
  models: string[]
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  for (const model of models) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: sys + " IMPORTANT: Respond with ONLY valid JSON. No markdown, no preamble." },
            { role: "user", content: p }
          ],
          temperature: 0.1,
          max_tokens: 2500
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        if (data.choices?.[0]?.message?.content) {
          return cleanJSON(data.choices[0].message.content);
        }
      }
      const errorText = await res.text();
      console.warn(`Groq ${model} error ${res.status}: ${errorText}`);
      if (res.status === 404 || res.status === 400) continue;
      break;
    } catch (err: any) {
      console.warn(`Groq ${model} failed:`, err.name === 'AbortError' ? 'Timeout' : err);
    }
  }
  return null;
}

async function callOpenRouter(
  sys: string,
  p: string,
  timeout: number
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://queryquest.dev",
        "X-Title": "QueryQuest SQL Visualizer"
      },
      body: JSON.stringify({
        model: "qwen/qwen3-coder:free",
        messages: [
          { role: "system", content: sys + " IMPORTANT: Respond with ONLY valid JSON. No markdown, no preamble." },
          { role: "user", content: p }
        ],
        temperature: 0.1,
        max_tokens: 2500
      }),
      signal: controller.signal
    });
    clearTimeout(id);

    if (res.ok) {
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return cleanJSON(data.choices[0].message.content);
      }
    }
    const errorText = await res.text();
    console.warn(`OpenRouter error ${res.status}: ${errorText}`);
  } catch (err: any) {
    console.warn("OpenRouter failed:", err.name === 'AbortError' ? 'Timeout' : err);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemInstruction, prompt } = body;

    if (!systemInstruction || !prompt) {
      return NextResponse.json(
        { error: 'Missing systemInstruction or prompt' },
        { status: 400 }
      );
    }

    const timeout = 30000;
    const groqModels = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile"
    ];

    // Try Groq first, then OpenRouter as fallback
    let result = await callGroq(systemInstruction, prompt, timeout, groqModels);
    if (!result) {
      result = await callOpenRouter(systemInstruction, prompt, timeout);
    }

    if (result) {
      return NextResponse.json({ content: result });
    }

    return NextResponse.json(
      { error: 'All AI providers failed' },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('AI API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
