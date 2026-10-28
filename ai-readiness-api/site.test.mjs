import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeUrl, isPrivateAddress, keyLinks, detectSignals, scoreSignals, signalList } = require('./lib/site.js');
const { validate } = require('./api/chat.js');
const { validate: validateReport } = require('./api/report.js');
const { searchName, findPlace, PLACE_ID } = require('./lib/google.js');

test('normalizeUrl', () => {
  assert.equal(normalizeUrl('yourstudio.com').href, 'https://yourstudio.com/');
  assert.equal(normalizeUrl(' http://a.co/x#y ').href, 'http://a.co/x');
  for (const bad of ['', 'localhost', 'ftp://a.co', 'https://a.co:8080', 'https://u:p@a.co', 'x'.repeat(201), null]) assert.equal(normalizeUrl(bad), null, String(bad));
});

test('isPrivateAddress', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) assert.ok(isPrivateAddress(ip), ip);
  for (const ip of ['8.8.8.8', '172.32.0.1', '2606:4700::1111']) assert.ok(!isPrivateAddress(ip), ip);
});

const HTML = `<html><head><title>Lotus Yoga</title><script src="https://widget.tawk.to/x.js"></script></head><body>
  <a href="/contact">Contact</a><a href="https://lotus.com/classes?x=1">Our classes</a><a href="/about">About</a>
  <a href="https://other.com/book">Book</a><a href="/pricing#top">Prices</a><a href="/schedule">Timetable</a>
  <a href="https://www.fresha.com/a/lotus">Book now</a><a href="https://wa.me/15551234">WhatsApp</a>
  <a href="tel:+15551234">Call</a><a href="https://instagram.com/lotus">IG</a></body></html>`;

test('detectSignals + score', () => {
  const found = detectSignals(HTML);
  assert.deepEqual(found, { booking: 'Fresha', chat: 'Tawk.to', whatsapp: true, social: true, phone: true });
  assert.deepEqual(scoreSignals(found), { score: 46, band: 'Emerging' });
  assert.deepEqual(scoreSignals({}), { score: 0, band: 'Starting' });
  // Google adds up to 30: listing 5, rating >=4.5 10, 100+ reviews 15.
  assert.equal(scoreSignals(found, { rating: 4.8, reviewCount: 240 }).score, 76);
  assert.equal(scoreSignals(found, { rating: 4.2, reviewCount: 31 }).score, 64);
  assert.equal(scoreSignals(found, { rating: null, reviewCount: 0 }).score, 51);
  assert.equal(signalList(found).find((s) => s.key === 'booking').detail, 'Fresha');
});

test('keyLinks keeps same-site key pages only, max 3', () => {
  assert.deepEqual(keyLinks(HTML, new URL('https://www.lotus.com/')), ['https://www.lotus.com/contact', 'https://lotus.com/classes', 'https://www.lotus.com/pricing']);
});

test('chat validate', () => {
  const ok = { email: 'a@b.co', website: 'https://a.co/', analysis: { score: 10 }, messages: [] };
  assert.equal(validate(ok).messages.length, 0);
  assert.equal(validate({ ...ok, messages: [{ role: 'user', content: 'hi' }] }).messages.length, 1);
  assert.ok(validate({ ...ok, email: 'x' }).error);
  assert.ok(validate({ ...ok, messages: [{ role: 'system', content: 'x' }] }).error);
  assert.ok(validate({ ...ok, messages: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'yo' }] }).error);
  assert.ok(validate({ ...ok, messages: Array(21).fill({ role: 'user', content: 'x' }) }).error);
  assert.ok(validate({ ...ok, analysis: { x: 'y'.repeat(13000) } }).error);
});

test('searchName', () => {
  assert.equal(searchName('CorePower Yoga | Yoga Classes'), 'CorePower Yoga');
  assert.equal(searchName('Home - Bliss Salon'), 'Bliss Salon');
  assert.equal(searchName('Smith-Jones Physio'), 'Smith-Jones Physio');
  assert.equal(searchName('Yogaworks: All You Need'), 'Yogaworks');
});

test('findPlace matches by website domain, else offers candidates', async () => {
  const real = global.fetch;
  const stub = (places) => (global.fetch = async () => ({ ok: true, json: async () => ({ places }) }));
  const p = (id, web) => ({ id: id.padEnd(12, 'x'), displayName: { text: id }, formattedAddress: 'Austin', websiteUri: web });
  try {
    stub([p('a', 'https://other.com'), p('b', 'http://www.lotus.com/austin')]);
    assert.deepEqual(await findPlace('Lotus Yoga', 'https://lotus.com/'), { status: 'found', id: 'bxxxxxxxxxxx' });
    stub([p('a', 'https://lotus.com/1'), p('b', 'https://lotus.com/2'), p('c', 'https://x.com'), p('d', 'https://lotus.com/3'), p('e', 'https://lotus.com/4')]);
    const chain = await findPlace('Lotus Yoga', 'https://lotus.com/');
    assert.equal(chain.status, 'choose');
    assert.deepEqual(chain.candidates.map((c) => c.name), ['a', 'b', 'd']);
    stub([]);
    assert.deepEqual(await findPlace('Lotus Yoga', 'https://lotus.com/'), { status: 'none' });
  } finally { global.fetch = real; }
});

test('report validate', () => {
  const scan = { website: 'https://lotus.com/', signals: [{ key: 'booking', found: true, detail: 'Fresha' }, { key: 'chat', found: false }], google: { status: 'none' }, title: 'Lotus', text: 'hi' };
  const ok = validateReport({ scan, answers: { team: 'small', headache: 'noshows' } });
  assert.deepEqual(ok.found, { booking: 'Fresha' });
  assert.equal(ok.lines.length, 2);
  assert.ok(validateReport({ scan, answers: {} }).lines);
  assert.ok(validateReport({ scan, answers: { team: 'huge' } }).error);
  assert.ok(validateReport({ scan, answers: { nope: 'small' } }).error);
  assert.ok(validateReport({ scan: { ...scan, signals: [{ key: 'evil', found: true }] } }).error);
  assert.ok(validateReport({ scan: { ...scan, text: 'x'.repeat(31000) } }).error);
  assert.ok(validateReport({ scan, placeId: '../../etc' }).error);
  assert.equal(validateReport({ scan, placeId: 'none' }).placeId, 'none');
  assert.ok(PLACE_ID.test('ChIJN1t_tDeuEmsRUsoyG83frY4'));
});
