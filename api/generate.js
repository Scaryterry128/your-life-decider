export const config = {
  runtime: 'edge', // Vercel Edge Runtime for faster serverless execution
};

const SYSTEM_PROMPT=`You are a Master Life Scheduler. User gives daily constraints, available hours, and goals (with past experience).
RULES:
1. "time_management": Evaluate constraints vs free time. Output daily_schedule array breaking down hours for chores (sleep/work) and exact hours per goal.
2. For each "goal":
- "analysis" Evaluate it independently.
- "daily_plan": User selected a Target Duration (Days). Generate EXACTLY that number of days logically in the array. Skip beginner steps if experienced.
- "gadgets": Construct explicit urls (e.g. amazon.com/s?k=microphone).
- "learning": Provide specific Youtube Search URLs & websites.
- "post_mastery": Provide jobs, monetization tactics.
OUTPUT RAW JSON MATCHING:
{"time_management":{"evaluation":"...","daily_schedule":[{"activity":"...","hours":0}]},"goals":[{"goal_number":1,"goal_name":"...","analysis":{"verdict":"Good ✅","phase_duration":"X Days","explanation":"...","breakdown":["..."]},"guide":{"steps":["..."],"milestones":["..."]},"daily_plan":[{"day":"Day 1","action":"..."}],"gadgets":[{"name":"","price_guess":"","url":"","platform":"","reason":""}],"learning":{"channels":[{"name":"","url":"","description":""}],"videos":[{"title":"","url":""}],"websites":[{"name":"","url":""}]},"post_mastery":{"applications":[""],"monetization":[""],"next_steps":[""]}}]}`;

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { prompt } = await request.json();
    
    // Securely pull API Key from Vercel Server Environment
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server missing GROQ_API_KEY environment variable.' }), { status: 500 });
    }

    const payload = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    };

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!groqRes.ok) throw new Error(await groqRes.text());
    
    const data = await groqRes.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
