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

// List of supported Groq model candidates in order of preference
const MODEL_CANDIDATES = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "llama-3.1-8b-instant",
  "qwen/qwen3.6-27b"
];

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

    // 1. Dynamically check active models for this key to prevent 404 model_not_found
    let selectedModel = MODEL_CANDIDATES[0];
    try {
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        const availableIds = (modelsData.data || []).map(m => m.id);
        
        // Find first candidate present in the account's accessible model list
        const match = MODEL_CANDIDATES.find(c => availableIds.includes(c));
        if (match) {
          selectedModel = match;
        } else if (availableIds.length > 0) {
          const textModel = availableIds.find(id => !id.includes('whisper') && !id.includes('guard') && !id.includes('orpheus'));
          if (textModel) selectedModel = textModel;
        }
      }
    } catch (e) {
      console.warn('Could not fetch model list dynamically, falling back to default list.', e);
    }

    // 2. Fallback loop across candidates if selected model fails
    let groqRes;
    let errText = '';
    const modelsToTry = [selectedModel, ...MODEL_CANDIDATES.filter(m => m !== selectedModel)];

    for (const modelId of modelsToTry) {
      const payload = {
        model: modelId,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      };

      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (groqRes.ok) {
        break; // Successfully generated output
      }

      errText = await groqRes.text();
      // Stop looping if error is not model_not_found (e.g. 401 Unauthorized)
      if (groqRes.status !== 404 && !errText.includes('model_not_found')) {
        break;
      }
    }

    if (!groqRes || !groqRes.ok) {
      return new Response(
        JSON.stringify({ error: `Groq API error (${groqRes?.status || 500}): ${errText}` }), 
        { status: groqRes?.status || 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const groqData = await groqRes.json();
    const contentStr = groqData.choices?.[0]?.message?.content || '{}';
    const cleanedContent = contentStr.replace(/```json|```/g, '').trim();
    const scheduleData = JSON.parse(cleanedContent);

    return new Response(JSON.stringify(scheduleData), {
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
