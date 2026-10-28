const { normalizeUrl, readSite, scoreSignals, signalList } = require('../lib/site');
const { findPlace, placeDetails } = require('../lib/google');
const { cors } = require('../lib/shared');

// Reads the site, then looks the business up on Google. No AI here: it runs while the visitor answers questions.
// ponytail: no in-function rate limit; use a Vercel Firewall rule on /api/* (e.g. 5/min/IP), add Upstash if abuse shows up
module.exports = async function handler(req, res) {
  if (!cors(req, res)) return;
  const url = normalizeUrl((req.body || {}).website);
  if (!url) return res.status(400).json({ error: 'Enter your website address, like yourbusiness.com.' });

  let site;
  try {
    site = await readSite(url);
  } catch (e) {
    console.error('read failed', url.href, e.message);
  }
  if (!site) return res.status(422).json({ error: "We couldn't open that website. Check the address and try again." });

  let google = { status: 'unavailable' };
  if (process.env.GOOGLE_PLACES_API_KEY) {
    try {
      const match = await findPlace(site.title, site.url);
      google = match.status === 'found' ? { status: 'found', place: await placeDetails(match.id) } : match;
    } catch (e) {
      console.error('google lookup failed', e.message);
    }
  }

  const { score, band } = scoreSignals(site.found, google.place);
  res.status(200).json({
    website: site.url, pagesRead: site.pagesRead, title: site.title, description: site.description, text: site.text,
    signals: signalList(site.found), google, score, band,
  });
};
