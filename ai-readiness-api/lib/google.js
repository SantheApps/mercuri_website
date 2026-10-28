// Google Places API (New). Server-side key restricted to the Places API, with a daily quota cap.
const BASE = 'https://places.googleapis.com/v1';
const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };

async function places(path, { body, fields }) {
  const r = await fetch(BASE + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': fields, ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Places ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// "CorePower Yoga | Yoga Classes, ..." -> "CorePower Yoga"; "Home - Bliss Salon" -> "Bliss Salon"
const GENERIC = /^(home|homepage|home page|welcome|index|official site|official website)$/i;
const searchName = (title) => (title.split(/\s*[|–—·]\s*|\s-\s|:\s/).map((s) => s.trim()).find((s) => s && !GENERIC.test(s)) || '').slice(0, 100);

// Returns { status: 'found', id } | { status: 'choose', candidates } | { status: 'none' }.
async function findPlace(title, website) {
  const query = searchName(title) || host(website);
  const { places: results = [] } = await places('/places:searchText', {
    body: { textQuery: query, pageSize: 5 },
    fields: 'places.id,places.displayName,places.formattedAddress,places.websiteUri',
  });
  const domain = host(website);
  const matches = results.filter((p) => p.websiteUri && host(p.websiteUri) === domain);
  if (matches.length === 1) return { status: 'found', id: matches[0].id };
  const pool = (matches.length ? matches : results).slice(0, 3);
  if (!pool.length) return { status: 'none' };
  return { status: 'choose', candidates: pool.map((p) => ({ id: p.id, name: p.displayName?.text || '', address: p.formattedAddress || '' })) };
}

// Only what the page shows and the AI needs. Reviews are shown word for word with attribution, never summarised.
async function placeDetails(id) {
  if (!PLACE_ID.test(id)) throw new Error('bad place id');
  const p = await places(`/places/${id}`, {
    fields: 'id,displayName,formattedAddress,rating,userRatingCount,reviews,regularOpeningHours,nationalPhoneNumber,primaryTypeDisplayName,googleMapsUri',
  });
  return {
    id: p.id,
    name: p.displayName?.text || '',
    address: p.formattedAddress || '',
    type: p.primaryTypeDisplayName?.text || '',
    rating: p.rating ?? null,
    reviewCount: p.userRatingCount ?? 0,
    phone: p.nationalPhoneNumber || '',
    hours: p.regularOpeningHours?.weekdayDescriptions || [],
    mapsUri: p.googleMapsUri || '',
    reviews: (p.reviews || []).slice(0, 3).map((r) => ({
      author: r.authorAttribution?.displayName || 'A Google user',
      authorUri: r.authorAttribution?.uri || '',
      rating: r.rating ?? null,
      when: r.relativePublishTimeDescription || '',
      text: (r.text?.text || r.originalText?.text || '').slice(0, 600),
    })),
  };
}

module.exports = { PLACE_ID, searchName, findPlace, placeDetails };
