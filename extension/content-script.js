// Always inject script for API capture (in both top frame and iframes)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
(document.head || document.documentElement).appendChild(script);

// Always listen for messages from injected.js and forward to background
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== 'trx-page') return;

  try {
    chrome.runtime.sendMessage({
      type: 'API_CAPTURED',
      url: event.data.url,
      data: event.data.data,
      body: event.data.body,
      timestamp: event.data.timestamp
    });
  } catch(err) {
    console.warn('[TRX] Send error:', err);
  }
});

// Only inject floating UI in TOP frame (not in iframes)
if (window.self === window.top) {
  console.log('[TRX Companion] Content script loaded (TOP frame)');
  injectFloatingUI();
} else {
  console.log('[TRX Companion] Content script loaded (IFRAME) - capture only');
}

function injectFloatingUI() {
  const trackerUI = document.createElement('div');
  trackerUI.id = 'trx-floating-tracker';
  trackerUI.style.cssText = `
      position: fixed;
      top: 50%;
      left: 20px;
      transform: translateY(-50%);
      width: 320px;
      background: #1a1d23;
      border: 1px solid #444;
      border-radius: 8px;
      color: white;
      font-family: Arial, sans-serif;
      z-index: 999999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      overflow: hidden;
      display: none;
  `;

  trackerUI.innerHTML = `
      <div id="trx-drag-header" style="background: #2a2d35; padding: 10px; cursor: move; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444;">
          <span style="font-size: 14px; font-weight: bold; color: #ffcc00;">Bet Tracker</span>
          <button id="trx-toggle-btn" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">-</button>
      </div>
      <div id="trx-tracker-content" style="padding: 15px;">
          <div style="display: flex; justify-content: space-between; text-align: center;">
              <div>
                  <div style="color: #888; font-size: 11px; margin-bottom: 5px;">WINS</div>
                  <div id="trx-win-count" style="color: #00ff00; font-size: 20px; font-weight: bold;">0</div>
              </div>
              <div style="border-left: 1px solid #444; border-right: 1px solid #444; padding: 0 20px;">
                  <div style="color: #888; font-size: 11px; margin-bottom: 5px;">PROFIT</div>
                  <div id="trx-profit" style="color: #ffcc00; font-size: 20px; font-weight: bold;">0.00</div>
              </div>
              <div>
                  <div style="color: #888; font-size: 11px; margin-bottom: 5px;">LOSSES</div>
                  <div id="trx-loss-count" style="color: #ff4444; font-size: 20px; font-weight: bold;">0</div>
              </div>
          </div>
      </div>
  `;

  document.body.appendChild(trackerUI);

  const dragHeader = document.getElementById('trx-drag-header');
  let isDragging = false;
  let currentX = 20;
  let currentY = window.innerHeight / 2;
  let initialX;
  let initialY;

  dragHeader.addEventListener('mousedown', (e) => {
      initialX = e.clientX - currentX;
      initialY = e.clientY - currentY;
      isDragging = true;
  });

  document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      trackerUI.style.transform = 'none';
      trackerUI.style.left = currentX + 'px';
      trackerUI.style.top = currentY + 'px';
  });

  document.addEventListener('mouseup', () => {
      isDragging = false;
  });

  document.getElementById('trx-toggle-btn').addEventListener('click', () => {
      const content = document.getElementById('trx-tracker-content');
      if (content.style.display === 'none') {
          content.style.display = 'block';
          document.getElementById('trx-toggle-btn').innerText = '-';
      } else {
          content.style.display = 'none';
          document.getElementById('trx-toggle-btn').innerText = '+';
      }
  });

  window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.source !== 'trx-page') return;

      const { wins, losses, profit } = event.data.data || {};

      if (wins !== undefined) {
        const el = document.getElementById('trx-win-count');
        if(el) el.innerText = wins;
      }
      if (losses !== undefined) {
        const el = document.getElementById('trx-loss-count');
        if(el) el.innerText = losses;
      }
      if (profit !== undefined) {
        const el = document.getElementById('trx-profit');
        if(el) el.innerText = profit;
      }
  });
}
