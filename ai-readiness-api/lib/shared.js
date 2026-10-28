const PROD_ORIGINS = ['https://mercuri.cx', 'https://www.mercuri.cx'];

// The AI may only recommend these, so it never promises features we don't have.
const FEATURES = [
  'AI employee that replies 24/7 on WhatsApp, SMS, email and Instagram',
  'Online booking through chat',
  'Appointment and class reminders',
  'Waitlist auto-fill when a slot opens',
  'Win-back messages for customers who stop coming',
  'Google review requests after every visit',
  'Alerts for new and low-star Google reviews',
  'Automated follow-up flows',
  'Segmented campaigns with revenue tracking',
  'Shared inbox for every conversation',
  'Wix and Shopify integrations',
];

const MERCURI_FACTS = `Mercuri is an AI employee for studios, salons, spas and clinics. It answers every customer instantly on WhatsApp, SMS, email and Instagram, books appointments, sends reminders, fills cancelled slots, brings back lapsed customers and asks for Google reviews. It learns the business's services and policies, replies in its voice, and hands over to a human when needed.
Price: one plan, $99/month, everything included (WhatsApp, SMS, email, Instagram, Google reviews, automations, AI). Month to month, first month free, no credit card. Sign up: https://client.mercuri.cx/auth/signup. Book a demo: https://calendly.com/karthikmanjunath/30min.
Features: ${FEATURES.join('; ')}.`;

// Sets CORS headers; returns false (and ends the response) when the request must stop here.
function cors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = PROD_ORIGINS.includes(origin) || (process.env.VERCEL_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin));
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.status(allowed ? 204 : 403).end(); return false; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only.' }); return false; }
  if (!allowed) { res.status(403).json({ error: 'Origin not allowed.' }); return false; }
  return true;
}

async function azure(messages, { json = false, maxTokens = 900 } = {}) {
  const { AZURE_API_BASE, AZURE_API_KEY, AZURE_API_VERSION, AZURE_DEPLOYMENT_NAME } = process.env;
  const url = `${AZURE_API_BASE.replace(/\/$/, '')}/openai/deployments/${AZURE_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'api-key': AZURE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, max_tokens: maxTokens, temperature: 0.4, ...(json && { response_format: { type: 'json_object' } }) }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`Azure ${r.status}: ${await r.text()}`);
  const content = (await r.json()).choices[0].message.content;
  return json ? JSON.parse(content) : content;
}

// Awaited (with a short timeout) because serverless functions can freeze after responding; a failed webhook never blocks the visitor.
async function sendLead(lead) {
  if (!process.env.LEADS_WEBHOOK_URL) return console.log('lead (no LEADS_WEBHOOK_URL set)', lead.email);
  await fetch(process.env.LEADS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'ai-readiness', createdAt: new Date().toISOString(), ...lead }),
    signal: AbortSignal.timeout(3000),
  }).catch((e) => console.error('lead webhook failed', e));
}

module.exports = { FEATURES, MERCURI_FACTS, cors, azure, sendLead };
