// Asked while the site is scanned. Shared by ai-readiness.html (plain <script>) and api/report.js (require).
// Answers tailor the report; they never change the score.
var READINESS_QUESTIONS = [
  { id: 'team', q: 'How big is your team?', options: [
    { id: 'solo', label: 'Just me' }, { id: 'small', label: '2–5 people' }, { id: 'mid', label: '6–20 people' }, { id: 'large', label: 'More than 20' },
  ] },
  { id: 'volume', q: 'Roughly how many customer messages and calls do you get a week?', options: [
    { id: 'low', label: 'Under 25' }, { id: 'mid', label: '25–100' }, { id: 'high', label: 'More than 100' },
  ] },
  { id: 'headache', q: "What's your biggest headache right now?", options: [
    { id: 'replies', label: 'Missed calls and slow replies' }, { id: 'noshows', label: 'No-shows and cancellations' },
    { id: 'reviews', label: 'Not enough Google reviews' }, { id: 'retention', label: "Customers not coming back" }, { id: 'admin', label: 'Too much admin' },
  ] },
];

// answers: { [questionId]: optionId }, any question may be skipped. Returns readable lines, or null if anything is unknown.
function describeAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return null;
  var lines = [];
  for (var key in answers) {
    var qn = READINESS_QUESTIONS.find(function (q) { return q.id === key; });
    var opt = qn && qn.options.find(function (o) { return o.id === answers[key]; });
    if (!opt) return null;
    lines.push(qn.q + ' ' + opt.label);
  }
  return lines;
}

if (typeof module !== 'undefined') module.exports = { READINESS_QUESTIONS, describeAnswers };
