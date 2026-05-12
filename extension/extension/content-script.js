// ═══════════════════════════════════════════════════
// TRX Chart Companion - Content Script
// Runs on 6win598.com to intercept bet API calls
// ═══════════════════════════════════════════════════

console.log('🎯 [TRX Companion] Content script loaded');

const EXT_ID = 'trx-chart-companion';
const CHART_URL = 'https://trx-chart.pages.dev';
const API_HOST = 'lotteryapi';

// ============ Fetch Interceptor ============
const originalFetch = window.fetch;

window.fetch = async function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : args[0].url;
  const opts = args[1] || {};
  
  // Only intercept lottery API calls
  if (!url.includes(API_HOST)) {
    return originalFetch.apply(this, args);
  }
  
  // Make the actual request
  const response = await originalFetch.apply(this, args);
  
  try {
    // Clone response to read it without consuming
    const cloned = response.clone();
    const data = await cloned.json();
    
    // Detect API type by URL pattern
    if (url.includes('GetMyEmerdList')) {
      // Bet history list
      handleBetHistory(data, opts);
    }
    else if (url.includes('GameBetting') || url.includes('PlaceBet')) {
      // Bet placement
      handleBetPlaced(data, opts);
    }
    else if (url.includes('GetBalance')) {
      // Balance update
      handleBalance(data);
    }
    else if (url.includes('GetMyEmerdInfo')) {
      // Bet detail
      handleBetDetail(data);
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return response;
};

// ============ Handlers ============
function handleBetHistory(data, opts) {
  if (!data || !data.data || !data.data.list) return;
  
  const bets = data.data.list.map(bet => ({
    orderId: bet.orderId || bet.id,
    period: bet.issueNumber,
    choice: parseChoice(bet),
    amount: parseFloat(bet.money || bet.amount || 0),
    winAmount: parseFloat(bet.winAmount || bet.profit || 0),
    status: parseStatus(bet),
    result: bet.result,
    createTime: bet.createTime || bet.addtime,
    type: bet.type
  }));
  
  console.log('🎯 [TRX] Bet history:', bets.length, 'records');
  
  sendToBackground({
    type: 'BET_HISTORY',
    bets: bets,
    total: data.data.totalCount,
    timestamp: Date.now()
  });
}

function handleBetPlaced(data, opts) {
  if (!data || data.code !== 0) return;
  
  let requestData = {};
  try {
    if (opts.body) requestData = JSON.parse(opts.body);
  } catch(e) {}
  
  const bet = {
    period: requestData.issueNumber || data.data?.issueNumber,
    choice: requestData.bet || requestData.betType,
    amount: parseFloat(requestData.amount || 0),
    timestamp: Date.now()
  };
  
  console.log('🎯 [TRX] Bet placed:', bet);
  
  sendToBackground({
    type: 'BET_PLACED',
    bet: bet
  });
}

function handleBalance(data) {
  if (!data || !data.data) return;
  
  sendToBackground({
    type: 'BALANCE_UPDATE',
    balance: parseFloat(data.data.amount || 0),
    timestamp: Date.now()
  });
}

function handleBetDetail(data) {
  if (!data || !data.data) return;
  
  sendToBackground({
    type: 'BET_DETAIL',
    bet: data.data
  });
}

// ============ Helpers ============
function parseChoice(bet) {
  // Various field names for bet choice
  const raw = (bet.type || bet.betType || bet.bet || '').toString().toLowerCase();
  if (raw.includes('big') || raw === '1') return 'big';
  if (raw.includes('small') || raw === '2') return 'small';
  if (raw === 'red' || raw === 'green' || raw === 'violet') return raw;
  return raw;
}

function parseStatus(bet) {
  // Status field variations
  const status = bet.status;
  if (status === 1 || status === '1' || status === 'Succeed' || status === 'win') return 'win';
  if (status === 0 || status === '0' || status === 'Failed' || status === 'lose') return 'loss';
  if (status === 2 || status === '2' || status === 'Pending') return 'pending';
  
  // Fallback: check by winAmount
  const win = parseFloat(bet.winAmount || bet.profit || 0);
  if (win > 0) return 'win';
  if (win < 0) return 'loss';
  return 'pending';
}

// ============ Background Communication ============
function sendToBackground(message) {
  // Inject script bridge to communicate with extension
  window.postMessage({
    source: 'trx-companion-page',
    target: 'trx-companion-bg',
    payload: message
  }, '*');
}

// ============ Inject bridge script ============
(function() {
  // Bridge script to communicate page <-> background
  const script = document.createElement('script');
  script.textContent = `
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.source === 'trx-companion-page') {
        // Forward to chrome runtime via custom event
        document.dispatchEvent(new CustomEvent('trx-msg', {
          detail: event.data.payload
        }));
      }
    });
  `;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
})();

// Listen for events and forward to background
document.addEventListener('trx-msg', (e) => {
  try {
    chrome.runtime.sendMessage(e.detail);
  } catch(err) {
    console.warn('[TRX] Send error:', err);
  }
});

console.log('✅ [TRX Companion] Ready - intercepting API calls');
