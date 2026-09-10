export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are a Master Life Scheduler. User gives daily constraints, available hours, and goals.
RULES:
1. "time_management": Evaluate constraints vs free time. Output daily_schedule array breaking down hours for chores and exact hours per goal.
2. For each "goal":
- "analysis": Evaluate it independently.
- "daily_plan": Keep daily plan concise (maximum 10 key actionable days).
- "gadgets": Construct explicit search URLs (e.g. amazon.com/s?k=microphone).
- "learning": Provide specific Youtube Search URLs & websites.
- "post_mastery": Provide jobs, monetization tactics.
OUTPUT RAW JSON MATCHING:
{"time_management":{"evaluation":"...","daily_schedule":[{"activity":"...","hours":0}]},"goals":[{"goal_number":1,"goal_name":"...","analysis":{"verdict":"Good ✅","phase_duration":"X Days","explanation":"...","breakdown":["..."]},"guide":{"steps":["..."],"milestones":["..."]},"daily_plan":[{"day":"Day 1","action":"..."}],"gadgets":[{"name":"","price_guess":"","url":"","platform":"","reason":""}],"learning":{"channels":[{"name":"","url":"","description":""}],"videos":[{"title":"","url":""}],"websites":[{"name":"","url":""}]},"post_mastery":{"applications":[""],"monetization":[""],"next_steps":[""]}}]}`;

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt } = await request.json();
    const rawApiKey = process.env.GROQ_API_KEY;

    if (!rawApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing GROQ_API_KEY in Vercel Environment Variables.' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = rawApiKey.trim();

    const payload = {
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    };

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(
        JSON.stringify({ error: `Groq API returned status ${groqRes.status}: ${errText}` }), 
        { status: groqRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await groqRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
  }
}
