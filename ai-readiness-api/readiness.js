// Shared by ai-readiness.html (as a plain <script>) and api/assess.js (via require).
// Each option scores 0-2; the score is the percentage of the maximum.
var READINESS_BUSINESS_TYPES = [
  { id: 'studio', label: 'Studio' },
  { id: 'salon', label: 'Salon or spa' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'other', label: 'Other' },
];

var READINESS_QUESTIONS = [
  { id: 'channel', q: 'How do customers usually reach you?', options: [
    { id: 'phone', label: 'Phone calls', pts: 0 },
    { id: 'desk', label: 'Walk-ins at the front desk', pts: 0 },
    { id: 'email', label: 'Email', pts: 1 },
    { id: 'app', label: 'Website form or booking app', pts: 2 },
    { id: 'chat', label: 'WhatsApp or SMS', pts: 2 },
  ] },
  { id: 'replies', q: 'When someone messages after hours, when do they hear back?', options: [
    { id: 'nextday', label: 'Next day', pts: 0 },
    { id: 'hours', label: 'Within a few hours', pts: 1 },
    { id: 'instant', label: 'Instantly', pts: 2 },
  ] },
  { id: 'booking', q: 'How do customers book appointments or classes?', options: [
    { id: 'manual', label: 'Phone or in person', pts: 0 },
    { id: 'mixed', label: 'A mix of both', pts: 1 },
    { id: 'online', label: 'Online booking tool', pts: 2 },
  ] },
  { id: 'openings', q: 'When a slot opens up or someone cancels, what happens?', options: [
    { id: 'nothing', label: 'Usually nothing, it stays empty', pts: 0 },
    { id: 'manual', label: 'We message people by hand', pts: 1 },
    { id: 'auto', label: 'It is offered to the next person automatically', pts: 2 },
  ] },
  { id: 'reminders', q: 'Do customers get appointment reminders?', options: [
    { id: 'no', label: 'No', pts: 0 },
    { id: 'manual', label: 'Sometimes, sent by hand', pts: 1 },
    { id: 'auto', label: 'Yes, automatically', pts: 2 },
  ] },
  { id: 'lapsed', q: 'When a regular stops coming, do you reach out?', options: [
    { id: 'no', label: "No, we don't notice in time", pts: 0 },
    { id: 'manual', label: 'Sometimes, if we remember', pts: 1 },
    { id: 'auto', label: 'Yes, a win-back message goes out', pts: 2 },
  ] },
  { id: 'reviews', q: 'After a visit, do you ask for a Google review?', options: [
    { id: 'no', label: 'No', pts: 0 },
    { id: 'manual', label: 'Sometimes, in person or by hand', pts: 1 },
    { id: 'auto', label: 'Yes, a request goes out after every visit', pts: 2 },
  ] },
  { id: 'data', q: 'Where does your customer list live?', options: [
    { id: 'paper', label: 'Paper or memory', pts: 0 },
    { id: 'sheets', label: 'Spreadsheets', pts: 1 },
    { id: 'system', label: 'A booking system or CRM', pts: 2 },
  ] },
  { id: 'ai', q: 'Does your team use AI tools today?', options: [
    { id: 'no', label: 'No', pts: 0 },
    { id: 'some', label: 'A little', pts: 1 },
    { id: 'daily', label: 'Every day', pts: 2 },
  ] },
];

// answers: { [questionId]: optionId }. Returns null if any answer is missing or unknown.
function readinessScore(answers) {
  var got = 0, max = 0, gaps = 0;
  for (var i = 0; i < READINESS_QUESTIONS.length; i++) {
    var qn = READINESS_QUESTIONS[i];
    var opt = qn.options.find(function (o) { return o.id === (answers || {})[qn.id]; });
    if (!opt) return null;
    var top = Math.max.apply(null, qn.options.map(function (o) { return o.pts; }));
    got += opt.pts; max += top;
    if (opt.pts < top) gaps++;
  }
  var score = Math.round((got / max) * 100);
  return { score: score, band: score < 40 ? 'Starting' : score <= 70 ? 'Emerging' : 'Ready', gaps: gaps };
}

if (typeof module !== 'undefined') module.exports = { READINESS_BUSINESS_TYPES, READINESS_QUESTIONS, readinessScore };
