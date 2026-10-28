import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeUrl, isPrivateAddress, keyLinks, detectSignals, scoreSignals, signalList } = require('./lib/site.js');
const { validate } = require('./api/chat.js');

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
  assert.deepEqual(scoreSignals(found), { score: 65, band: 'Emerging' });
  assert.deepEqual(scoreSignals({}), { score: 0, band: 'Starting' });
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
  assert.ok(validate({ ...ok, analysis: { x: 'y'.repeat(9000) } }).error);
});
