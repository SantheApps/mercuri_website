const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_BYTES = 1_500_000;
const UA = 'Mozilla/5.0 (compatible; MercuriReadinessBot/1.0; +https://mercuri.cx/ai-readiness.html)';

// What we look for in the raw HTML. Each signal: label shown to the visitor, points toward the score, and patterns.
// `vendors` maps a pattern to a product name so the report can say "Online booking (Fresha)".
const SIGNALS = {
  booking: { label: 'Online booking', pts: 18, vendors: {
    'calendly.com': 'Calendly', 'acuityscheduling.com': 'Acuity', 'mindbodyonline.com': 'Mindbody', 'fresha.com': 'Fresha',
    'vagaro.com': 'Vagaro', 'booksy.com': 'Booksy', 'squareup.com/appointments': 'Square', 'setmore.com': 'Setmore',
    'simplybook.': 'SimplyBook', 'glofox.com': 'Glofox', 'janeapp.com': 'Jane', 'cliniko.com': 'Cliniko',
    'momence.com': 'Momence', 'walla.app': 'Walla', 'zenoti.com': 'Zenoti', 'wix-bookings': 'Wix Bookings', '/booking-calendar': 'Wix Bookings',
  }, patterns: [/\bbook (now|online|an? appointment|a class)\b/i] },
  chat: { label: 'Live chat on the site', pts: 14, vendors: {
    'intercom': 'Intercom', 'tawk.to': 'Tawk.to', 'crisp.chat': 'Crisp', 'drift.com': 'Drift', 'livechatinc.com': 'LiveChat',
    'tidio': 'Tidio', 'zdassets.com': 'Zendesk', 'js.hs-scripts.com': 'HubSpot', 'freshchat': 'Freshchat', 'wix-chat': 'Wix Chat', 'chat-widget': 'Chat widget',
  }, patterns: [] },
  whatsapp: { label: 'WhatsApp contact', pts: 10, vendors: {}, patterns: [/wa\.me\//i, /api\.whatsapp\.com/i, /whatsapp:\/\//i] },
  reviews: { label: 'Google reviews shown or requested', pts: 8, vendors: {
    'elfsight': 'Elfsight', 'trustindex': 'Trustindex', 'search.google.com/local/writereview': 'Google review link', 'g.page/': 'Google review link',
  }, patterns: [/google reviews?/i, /\b\d(\.\d)? ?(stars?|★)/i] },
  emailCapture: { label: 'Newsletter or email sign-up', pts: 8, vendors: {
    'mailchimp': 'Mailchimp', 'list-manage.com': 'Mailchimp', 'klaviyo': 'Klaviyo', 'convertkit': 'ConvertKit', 'mailerlite': 'MailerLite',
  }, patterns: [/\b(subscribe|newsletter|sign up for (our )?(updates|offers))\b/i] },
  contactForm: { label: 'Contact form', pts: 8, vendors: {}, patterns: [/<form[\s>]/i] },
  social: { label: 'Instagram or Facebook linked', pts: 4, vendors: {}, patterns: [/instagram\.com\/[a-z0-9_.]/i, /facebook\.com\/[a-z0-9.]/i] },
  phone: { label: 'Phone number', pts: 0, vendors: {}, patterns: [/href=["']tel:/i] },
};

const KEY_PAGE = /(contact|book|appointment|schedule|reserve|services|treatments|classes|pricing|prices|menu|visit|location)/i;

function normalizeUrl(input) {
  if (typeof input !== 'string' || !input.trim() || input.length > 200) return null;
  let s = input.trim();
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    if (!['http:', 'https:'].includes(u.protocol) || !u.hostname.includes('.') || (u.port && !['80', '443'].includes(u.port)) || u.username || u.password) return null;
    u.hash = '';
    return u;
  } catch { return null; }
}

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
}

// ponytail: DNS is checked before each fetch but not pinned, so a rebinding attack has a tiny window; pin via a custom agent if this ever fetches anything sensitive
async function assertPublic(u) {
  if (net.isIP(u.hostname)) throw new Error('blocked');
  const addrs = await dns.lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error('blocked');
}

// Fetches one page, following up to 3 redirects and re-checking each hop. Returns { url, html } or null.
async function fetchPage(start) {
  let u = start;
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(u);
    const r = await fetch(u, { redirect: 'manual', headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(8000) });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      u = normalizeUrl(new URL(r.headers.get('location'), u).href);
      if (!u) return null;
      continue;
    }
    if (!r.ok || !(r.headers.get('content-type') || '').includes('text/html')) return null;
    const reader = r.body.getReader();
    const chunks = []; let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); size += value.length;
      if (size > MAX_BYTES) { reader.cancel(); break; }
    }
    return { url: u, html: Buffer.concat(chunks).toString('utf8') };
  }
  return null;
}

// Same-site links that look like contact/booking/services pages.
function keyLinks(html, base, limit = 3) {
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)) {
    let u;
    try { u = new URL(m[1], base); } catch { continue; }
    if (u.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '') || !['http:', 'https:'].includes(u.protocol)) continue;
    if (!KEY_PAGE.test(u.pathname + ' ' + m[2].replace(/<[^>]*>/g, ''))) continue;
    u.hash = ''; u.search = '';
    if (u.href !== base.href) out.add(u.href);
    if (out.size >= limit) break;
  }
  return [...out];
}

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#?\w+;/g, ' ').replace(/\s+/g, ' ').trim();

function pageText(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i) || [])[1] || '';
  const body = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  return { title: decode(title), description: decode(desc), body: decode(body) };
}

function detectSignals(html) {
  const found = {};
  for (const [key, s] of Object.entries(SIGNALS)) {
    const vendor = Object.keys(s.vendors).find((k) => html.toLowerCase().includes(k));
    if (vendor) found[key] = s.vendors[vendor];
    else if (s.patterns.some((p) => p.test(html))) found[key] = true;
  }
  return found;
}

// Website signals are worth 70, the Google listing 30. Self-reported answers never change the score.
function googlePoints(place) {
  if (!place) return 0;
  const r = place.rating || 0, n = place.reviewCount || 0;
  return 5 + (r >= 4.5 ? 10 : r >= 4 ? 5 : 0) + (n >= 100 ? 15 : n >= 30 ? 8 : n >= 1 ? 3 : 0);
}

function scoreSignals(found, place = null) {
  const score = Object.entries(SIGNALS).reduce((sum, [k, s]) => sum + (found[k] ? s.pts : 0), 0) + googlePoints(place);
  return { score, band: score < 40 ? 'Starting' : score <= 70 ? 'Emerging' : 'Ready' };
}

// For the visitor: every signal, found or not, in a fixed order.
function signalList(found) {
  return Object.entries(SIGNALS).map(([key, s]) => ({ key, label: s.label, found: !!found[key], detail: typeof found[key] === 'string' ? found[key] : null }));
}

async function readSite(url) {
  const home = await fetchPage(url);
  if (!home) return null;
  const pages = [home];
  const extra = await Promise.all(keyLinks(home.html, home.url).map((l) => fetchPage(normalizeUrl(l)).catch(() => null)));
  pages.push(...extra.filter(Boolean));
  const html = pages.map((p) => p.html).join('\n');
  const text = pageText(home.html);
  return {
    url: home.url.href,
    pagesRead: pages.map((p) => p.url.pathname),
    found: detectSignals(html),
    title: text.title.slice(0, 200),
    description: text.description.slice(0, 400),
    // ponytail: first 4k chars of visible text across pages is enough context for a 3-fix report
    text: pages.map((p) => pageText(p.html).body).join('\n').slice(0, 4000),
  };
}

module.exports = { SIGNALS, normalizeUrl, isPrivateAddress, keyLinks, detectSignals, scoreSignals, signalList, readSite };
