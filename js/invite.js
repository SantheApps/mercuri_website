// Invite forms ("Request an invite", "Invite a friend"), used two ways:
// - as a pop-up: js/main.js loads this file when an invite link is clicked and calls MercuriInvite.open(kind)
// - as a full page: invite.html / invite-a-friend.html call MercuriInvite.mount(root, kind)
// Both submit into the "Mercuri Invite" Google Form, which stores responses and emails karthik@mercuri.cx.
(function () {
  // ponytail: no-cors means we can't read Google's reply, so success = the request left the browser. Every field is
  // required on the Google side, so blanks are sent as '—'. If the form's questions change, update these IDs.
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSemJhyuR-aGdsor1hketm9eA4CFLm1tqCvplF4R20I2xS20yA/formResponse';
  const ENTRY = { name: 'entry.2145389757', email: 'entry.594021018', website: 'entry.185254587', phone: 'entry.722295103' };
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const DEMO = 'https://calendly.com/karthikmanjunath/30min';

  const INPUT = 'mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus:border-primary focus:ring-primary';
  const LINK = 'font-semibold text-slate-600 dark:text-slate-300 hover:text-primary';
  const field = (name, label, attrs, optional) =>
    `<label class="block"><span class="text-sm font-semibold text-charcoal dark:text-white">${label}${optional ? ' <span class="font-normal text-slate-500">(optional)</span>' : ''}</span>` +
    `<input name="${name}" ${attrs} class="${INPUT}"/></label>`;

  // Static markup only; visitor input is never written back into the page.
  const KINDS = {
    invite: {
      kicker: 'Invite only',
      title: 'Request an invite',
      intro: "We onboard a few businesses each week so every one gets set up properly. Tell us about yours and we'll be in touch.",
      fields:
        field('name', 'Your name', 'required maxlength="100" autocomplete="name"') +
        field('email', 'Email', 'type="email" required maxlength="200" autocomplete="email" placeholder="you@yourbusiness.com"') +
        field('website', 'Website or Instagram', 'required maxlength="200" autocomplete="url" placeholder="yourstudio.com or @yourstudio"') +
        field('phone', 'Phone or WhatsApp', 'type="tel" maxlength="40" autocomplete="tel"', true),
      button: 'Request an invite',
      extra: `<p class="text-sm text-slate-500 dark:text-slate-400">Prefer to talk first? <a class="${LINK}" href="${DEMO}" target="_blank">Book a demo →</a></p>`,
      privacy: "We'll only use your details to get in touch about Mercuri.",
      check: (v) => !v('name') ? ['name', 'Enter your name.'] : !EMAIL.test(v('email')) ? ['email', 'Enter a valid email.']
        : !v('website') ? ['website', 'Enter your website or Instagram handle.'] : null,
      fields2google: (v) => ({ name: v('name'), email: v('email'), website: v('website'), phone: v('phone') || '—' }),
      lead: 'invite_request',
      thanksKicker: 'Request received',
      thanksTitle: "You're on the list",
      thanksText: "Thanks! We'll review your business and email you when your spot is ready, usually within a week.",
      thanksExtra: `Can't wait? <a class="${LINK}" href="${DEMO}" target="_blank">Book a demo →</a>`,
    },
    friend: {
      kicker: 'For Mercuri customers',
      title: 'Invite a friend',
      intro: "Know another owner who's buried in messages? Tell us who they are and we'll invite them personally.",
      fields:
        field('your_name', 'Your name', 'required maxlength="100" autocomplete="name"') +
        field('your_email', 'Your email', 'type="email" required maxlength="200" autocomplete="email"') +
        '<p class="pt-4 text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Who should we invite?</p>' +
        field('friend_name', 'Their name', 'required maxlength="100" autocomplete="off"') +
        field('friend_email', 'Their email', 'type="email" required maxlength="200" autocomplete="off"') +
        field('friend_website', 'Their business website', 'maxlength="200" inputmode="url" autocomplete="off" placeholder="theirbusiness.com"', true),
      button: 'Send invite',
      extra: '',
      privacy: "We'll only use these details to invite your friend and let you know when they join.",
      check: (v) => !v('your_name') ? ['your_name', 'Enter your name.'] : !EMAIL.test(v('your_email')) ? ['your_email', 'Enter a valid email for yourself.']
        : !v('friend_name') ? ['friend_name', "Enter your friend's name."] : !EMAIL.test(v('friend_email')) ? ['friend_email', 'Enter a valid email for your friend.']
        : v('friend_email').toLowerCase() === v('your_email').toLowerCase() ? ['friend_email', "That's your own email. Enter your friend's."] : null,
      fields2google: (v) => ({
        name: `${v('friend_name')} (referred by ${v('your_name')})`,
        email: v('friend_email'),
        website: v('friend_website') || '—',
        phone: `Referred by ${v('your_name')} <${v('your_email')}>`,
      }),
      lead: 'referral',
      thanksKicker: 'Thanks',
      thanksTitle: 'Thanks for the referral',
      thanksText: "We'll reach out to your friend personally, usually within a few days, and let you know when they're in.",
      thanksExtra: '',
    },
  };

  // Ad-click and campaign parameters from the landing URL, sent with the analytics lead event.
  const ATTRIBUTION = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ttclid'];
  const attribution = () => {
    const q = new URLSearchParams(location.search);
    return Object.fromEntries(ATTRIBUTION.filter((key) => q.get(key)).map((key) => [key, q.get(key)]));
  };

  let uid = 0;
  // Renders the form into `root`. `compact` = pop-up sizing; the pop-up uses h2 so the page keeps a single h1.
  function mount(root, kind, compact) {
    const k = KINDS[kind];
    const id = `invite-${++uid}`;
    const hn = compact ? 'h2' : 'h1';
    const h = compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-6xl';
    const p = compact ? 'mt-3 text-slate-600 dark:text-slate-400' : 'mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed';
    root.innerHTML =
      `<section data-view="form">` +
      `<p class="text-xs font-bold uppercase tracking-[0.2em] text-primary ${compact ? 'mb-3' : 'mb-6'}">${k.kicker}</p>` +
      `<${hn} id="${id}-title" class="${h} font-bold tracking-tight leading-[1.05] text-charcoal dark:text-white">${k.title}</${hn}>` +
      `<p class="${p}">${k.intro}</p>` +
      `<form class="${compact ? 'mt-6' : 'mt-10'} space-y-5" novalidate>${k.fields}` +
      // Spam trap: real visitors never see or fill this.
      `<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true"/>` +
      `<p data-error id="${id}-error" role="alert" class="text-sm text-red-600"></p>` +
      `<button class="inline-block bg-charcoal dark:bg-primary text-white dark:text-charcoal px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-60">${k.button}</button>` +
      k.extra +
      `<p class="text-xs text-slate-500">${k.privacy} <a href="privacy.html" class="underline hover:text-primary">Privacy Policy</a></p>` +
      `</form></section>` +
      `<section data-view="thanks" hidden>` +
      `<p class="text-xs font-bold uppercase tracking-[0.2em] text-primary ${compact ? 'mb-3' : 'mb-6'}">${k.thanksKicker}</p>` +
      `<${hn} id="${id}-thanks" tabindex="-1" class="${h} font-bold tracking-tight leading-[1.05] text-charcoal dark:text-white outline-none">${k.thanksTitle}</${hn}>` +
      `<p class="${p}">${k.thanksText}</p>` +
      (k.thanksExtra ? `<p class="mt-6 text-slate-500 dark:text-slate-400">${k.thanksExtra}</p>` : '') +
      `</section>`;

    const form = root.querySelector('form');
    const err = root.querySelector('[data-error]');
    const btn = form.querySelector('button');
    root.closest('dialog')?.setAttribute('aria-labelledby', `${id}-title`);
    form.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const v = (name) => (f.get(name) || '').trim();
      form.querySelectorAll('[aria-invalid]').forEach((input) => { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); });
      const problem = k.check(v);
      if (problem) {
        const input = form.elements[problem[0]];
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', `${id}-error`);
        input.focus();
        return (err.textContent = problem[1]);
      }
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Sending…';
      const fields = k.fields2google(v);
      try {
        if (f.get('botcheck')) throw new Error('bot');
        // A hung request falls through to the email fallback instead of leaving "Sending…" up forever.
        const signal = AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined;
        await fetch(FORM, { method: 'POST', mode: 'no-cors', signal, body: new URLSearchParams(Object.entries(fields).map(([key, val]) => [ENTRY[key], val])) });
        root.querySelector('[data-view="form"]').hidden = true;
        root.querySelector('[data-view="thanks"]').hidden = false;
        root.closest('dialog')?.setAttribute('aria-labelledby', `${id}-thanks`);
        root.querySelector(`#${id}-thanks`).focus();
        if (!compact) window.scrollTo(0, 0);
        if (window.gtag) gtag('event', 'generate_lead', { method: k.lead, ...attribution() });
        if (window.fbq) fbq('track', 'Lead');
      } catch {
        const mail = `mailto:karthik@mercuri.cx?subject=${encodeURIComponent(k.title)}&body=${encodeURIComponent(Object.values(fields).join('\n'))}`;
        err.replaceChildren('Something went wrong sending this. ', Object.assign(document.createElement('a'), { href: mail, className: 'underline font-semibold', textContent: 'Email us instead' }), '.');
      } finally {
        btn.disabled = false;
        btn.textContent = k.button;
      }
    };
  }

  // Pop-up: a native <dialog> (focus trap, Esc to close and backdrop come from the browser).
  let dialog;
  function open(kind) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl p-0 bg-background-light dark:bg-background-dark text-charcoal dark:text-slate-200 shadow-2xl backdrop:bg-black/50';
      dialog.innerHTML = '<button type="button" aria-label="Close" class="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full text-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">×</button><div class="p-6 sm:p-8 pt-12 sm:pt-12"></div>';
      dialog.querySelector('button').onclick = () => dialog.close();
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // click on the backdrop
      dialog.addEventListener('close', () => document.documentElement.classList.remove('overflow-hidden'));
      document.body.append(dialog);
    }
    mount(dialog.lastElementChild, kind, true);
    document.documentElement.classList.add('overflow-hidden');
    dialog.showModal();
    dialog.querySelector('input').focus();
  }

  window.MercuriInvite = { mount, open };
})();
