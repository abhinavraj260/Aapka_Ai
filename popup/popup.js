// ── AI ASSISTANT Popup — no backend, all browser ─────────────

const micBtn  = document.getElementById('micBtn');
const icoMic  = document.getElementById('icoMic');
const icoStop = document.getElementById('icoStop');
const pill    = document.getElementById('pill');
const ptext   = document.getElementById('ptext');
const pdot    = document.getElementById('pdot');
const micZone = document.getElementById('micZone');
const bars    = document.getElementById('bars');
const micHint = document.getElementById('micHint');
const txBox   = document.getElementById('txBox');
const actBox  = document.getElementById('actBox');
const clrBtn  = document.getElementById('clrBtn');

let recog = null;
let listening = false;

// ── Quick nav buttons ─────────────────────────────────────────
document.querySelectorAll('.qb').forEach(b => {
  b.addEventListener('click', () => {
    const cmd = b.dataset.cmd;
    txBox.textContent = cmd;
    txBox.classList.add('on');
    dispatch(cmd);
  });
});

// ── Mic toggle ────────────────────────────────────────────────
micBtn.addEventListener('click', () => {
  listening ? stop() : start();
});

clrBtn.addEventListener('click', () => {
  txBox.innerHTML = '<span class="ghost">Say a command…</span>';
  actBox.textContent = 'Waiting for voice input…';
  actBox.className = 'act-box';
});

// ── Speech recognition ────────────────────────────────────────
function start() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showAct('❌ Speech API not supported. Use Chrome.', 'err');
    return;
  }

  recog = new SR();
  recog.lang = 'en-IN';
  recog.continuous = false;
  recog.interimResults = true;
  recog.maxAlternatives = 1;

  recog.onstart = () => {
    listening = true;
    setState('on', 'Listening…');
    micBtn.classList.add('on');
    icoMic.classList.add('gone');
    icoStop.classList.remove('gone');
    bars.classList.add('on');
    micZone.classList.add('listening');
    micHint.textContent = 'Click to stop';
    txBox.innerHTML = '<span class="ghost">Listening…</span>';
    txBox.classList.add('on');
  };

  recog.onresult = (e) => {
    let final = '', interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      e.results[i].isFinal ? (final += t) : (interim += t);
    }
    txBox.textContent = final || interim;
    if (final) {
      setState('proc', 'Processing…');
      dispatch(final.trim());
    }
  };

  recog.onerror = (e) => {
    const msgs = {
      'not-allowed': '🎤 Mic blocked — allow mic in Chrome site settings',
      'network':     '🌐 Network needed for speech — check connection',
      'no-speech':   '🔇 No speech heard — try again',
      'aborted':     '⏹ Stopped',
      'audio-capture': '🎙 No mic found',
    };
    showAct(msgs[e.error] || `Error: ${e.error}`, 'err');
    setState('err', 'Error');
    reset();
  };

  recog.onend = () => { if (listening) reset(); };
  recog.start();
}

function stop() { listening = false; recog?.stop(); reset(); }

function reset() {
  listening = false;
  setState('', 'Ready');
  micBtn.classList.remove('on');
  icoMic.classList.remove('gone');
  icoStop.classList.add('gone');
  bars.classList.remove('on');
  micZone.classList.remove('listening');
  micHint.textContent = 'Click to start listening';
  txBox.classList.remove('on');
}

function setState(cls, label) {
  pill.className = 'pill ' + cls;
  ptext.textContent = label;
}

// ── Dispatch command to content script ────────────────────────
function dispatch(text) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) { showAct('❌ No active tab found', 'err'); return; }

    // Handle navigation to new sites directly here
    const navTarget = getNavTarget(text.toLowerCase());
    if (navTarget) {
      chrome.tabs.update(tabs[0].id, { url: navTarget });
      showAct(`🌐 Navigating to ${navTarget}`, '');
      setTimeout(reset, 1200);
      return;
    }

    // All other commands go to content script
    chrome.tabs.sendMessage(tabs[0].id, { type: 'AI_ASSISTANT_CMD', text }, (resp) => {
      if (chrome.runtime.lastError) {
        // Content script not yet injected — inject it first
        chrome.scripting.executeScript(
          { target: { tabId: tabs[0].id }, files: ['content/content.js'] },
          () => {
            chrome.scripting.insertCSS(
              { target: { tabId: tabs[0].id }, files: ['content/overlay.css'] },
              () => {
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabs[0].id, { type: 'AI_ASSISTANT_CMD', text }, handleResp);
                }, 300);
              }
            );
          }
        );
      } else {
        handleResp(resp);
      }
    });

    setTimeout(reset, 1500);
  });
}

function handleResp(resp) {
  if (resp?.result) showAct(resp.result, '');
  else if (resp?.error) showAct(resp.error, 'err');
}

// ── Direct URL navigation ─────────────────────────────────────
function getNavTarget(lower) {
  const sites = {
    amazon:   'https://www.amazon.in',
    flipkart: 'https://www.flipkart.com',
    myntra:   'https://www.myntra.com',
    meesho:   'https://www.meesho.com',
    snapdeal: 'https://www.snapdeal.com',
    ajio:     'https://www.ajio.com',
    nykaa:    'https://www.nykaa.com',
    google:   'https://www.google.com',
    youtube:  'https://www.youtube.com',
  };
  for (const [key, url] of Object.entries(sites)) {
    if (lower.includes(key)) return url;
  }
  // "open mynewsite.com"
  const match = lower.match(/(?:open|go to|navigate to|visit)\s+([\w.-]+\.(?:com|in|org|net))/);
  if (match) return 'https://' + match[1];
  return null;
}

function showAct(msg, type) {
  actBox.textContent = msg;
  actBox.className = 'act-box' + (type ? ' ' + type : ' flash');
  setTimeout(() => actBox.classList.remove('flash'), 1000);
}