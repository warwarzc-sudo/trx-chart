// ═══════════════════════════════════════════════════
// TRX Chart Companion - Popup Script v2
// ═══════════════════════════════════════════════════

const STORAGE_KEY = 'trx_bets';
const BALANCE_KEY = 'trx_balance';
const CHART_URL = 'https://trx-chart.pages.dev';

document.addEventListener('DOMContentLoaded', async () => {
  // Check connection status
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url || '';
  
  const statusEl = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  
  if (url.includes('6win598.com')) {
    statusEl.classList.add('online');
    statusText.textContent = '✅ Connected - Tracking active';
  } else if (url.includes('trx-chart.pages.dev')) {
    statusEl.classList.add('online');
    statusText.textContent = '📊 Chart open - Ready to sync';
  } else {
    statusEl.classList.add('offline');
    statusText.textContent = '⚠️ Open 6win598.com to start';
  }
  
  // Load stats
  loadStats();
  
  // Open Chart button
  document.getElementById('openChart').addEventListener('click', () => {
    chrome.tabs.create({ url: CHART_URL });
  });
  
  // Sync Now button
  document.getElementById('syncNow').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ url: 'https://6win598.com/*' });
    if (tabs.length === 0) {
      alert('Please open 6win598.com first!');
      return;
    }
    chrome.tabs.reload(tabs[0].id);
    window.close();
  });
  
  // Clear Data button
  document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('Clear all bet data?\nThis cannot be undone.')) {
      chrome.storage.local.set({ 
        [STORAGE_KEY]: [],
        [BALANCE_KEY]: null
      }, () => {
        loadStats();
        alert('Data cleared!');
      });
    }
  });
});

function loadStats() {
  chrome.storage.local.get([STORAGE_KEY, BALANCE_KEY], (result) => {
    const bets = result[STORAGE_KEY] || [];
    const balance = result[BALANCE_KEY];
    
    // Total bets count
    document.getElementById('totalBets').textContent = bets.length;
    
    // Balance display (သုည ၂ လုံး တိုးထားသော အပိုင်း)
    let balanceText = '0';
    if (balance !== null && balance !== undefined) {
      if (typeof balance === 'object') {
        const amount = balance.amount || balance.balance || balance.money || 0;
        balanceText = (parseFloat(amount) * 100).toFixed(0); 
      } else {
        balanceText = (parseFloat(balance) * 100).toFixed(0);
      }
    }
    document.getElementById('balance').textContent = balanceText + ' MMK';
  });
}
