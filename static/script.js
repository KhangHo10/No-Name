(() => {
  const start = document.getElementById('start');
  const stop = document.getElementById('stop');
  const transcriptEl = document.getElementById('transcript');
  const parsedEl = document.getElementById('parsed');
  const responseEl = document.getElementById('response');

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    transcriptEl.textContent = 'Web Speech API not supported in this browser.';
    start.disabled = true;
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  let fullText = '';

  rec.addEventListener('result', (ev) => {
    const t = Array.from(ev.results).map(r => r[0].transcript).join(' ');
    fullText += (fullText ? ' ' : '') + t;
    transcriptEl.textContent = fullText;
    tryParseAndSend(fullText);
  });

  rec.addEventListener('end', () => {
    start.disabled = false;
    stop.disabled = true;
  });

  start.addEventListener('click', () => {
    fullText = '';
    transcriptEl.textContent = '(listening...)';
    parsedEl.textContent = '{}';
    responseEl.textContent = '{}';
    start.disabled = true;
    stop.disabled = false;
    rec.start();
  });

  stop.addEventListener('click', () => {
    rec.stop();
    start.disabled = false;
    stop.disabled = true;
  });

  function tryParseAndSend(text) {
    // Very naive parsing: look for amount (numbers), name (word after pay/send to)
    const amountMatch = text.match(/(\d+[\.,]?\d*)/);
    const payToMatch = text.match(/(?:to|pay|for)\s+([A-Z][a-zA-Z0-9_-]+)/i);
    const acctMatch = text.match(/account\s+(\w+)/i);

    const parsed = {
      name: payToMatch ? payToMatch[1] : null,
      amount: amountMatch ? amountMatch[1].replace(',', '.') : null,
      account: acctMatch ? acctMatch[1] : null,
      raw: text,
    };

    parsedEl.textContent = JSON.stringify(parsed, null, 2);

    // always send the captured text to the backend for server-side NLU/payment
    fetch('/process_voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    }).then(async (r) => {
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        responseEl.textContent = JSON.stringify(body || { error: 'bad response' }, null, 2);
        return;
      }
      responseEl.textContent = JSON.stringify(body, null, 2);
    }).catch(err => {
      responseEl.textContent = String(err);
    });
  }

})();
