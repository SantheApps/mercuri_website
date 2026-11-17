// Mercuri Invite Google Form -> Meta Conversions API "Lead" (server-side copy of the pop-up's browser Lead).
// Counts invite requests from visitors whose browser blocks the Meta Pixel. Meta merges it with the browser
// Lead when both arrive, because they share event_id.
//
// Lives in the form's Apps Script project (Form > ⋮ > Apps Script), not on the website. Setup:
//   1. Add an optional Short answer question titled exactly "Tracking" to the form.
//   2. Paste this file into the Apps Script editor and save.
//   3. Project Settings > Script properties: META_TOKEN = Conversions API token
//      (Events Manager > pixel 1625917745253902 > Settings > Conversions API > Generate access token).
//      Optional while testing: META_TEST_CODE = the code from Events Manager > Test events.
//   4. Triggers > Add trigger: sendLeadToMeta, From form, On form submit. Approve the permissions prompt.
// Only submissions with a "Tracking" answer are sent: the site fills it for Request an invite only,
// so Invite a friend (existing customers) never becomes a Lead.

const PIXEL_ID = '1625917745253902';
// ponytail: pinned Graph API version; Meta retires each about two years after release, bump it then.
const GRAPH = 'https://graph.facebook.com/v23.0/';

function sendLeadToMeta(e) {
  const tracking = e.response.getItemResponses().find((r) => r.getItem().getTitle() === 'Tracking');
  if (!tracking) return;
  let t;
  try { t = JSON.parse(tracking.getResponse()); } catch (err) { return console.warn('Tracking answer is not JSON'); }
  if (!t.event_id || !t.email) return;

  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('META_TOKEN');
  if (!token) return console.error('META_TOKEN script property is missing');

  const userData = { em: [sha256(t.email.trim().toLowerCase())] };
  if (t.fbp) userData.fbp = t.fbp;
  if (t.fbc) userData.fbc = t.fbc;
  if (t.ua) userData.client_user_agent = t.ua;

  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(e.response.getTimestamp().getTime() / 1000),
      event_id: t.event_id,
      action_source: 'website',
      event_source_url: t.url,
      user_data: userData,
      custom_data: { content_name: 'Request an invite' },
    }],
  };
  const testCode = props.getProperty('META_TEST_CODE');
  if (testCode) body.test_event_code = testCode;

  const res = UrlFetchApp.fetch(GRAPH + PIXEL_ID + '/events?access_token=' + encodeURIComponent(token), {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true,
  });
  // Failures show under Executions in the Apps Script editor; the form response itself is always kept.
  if (res.getResponseCode() !== 200) console.error('Meta CAPI ' + res.getResponseCode() + ': ' + res.getContentText());
}

function sha256(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map((b) => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
}
