const STORAGE_KEY = 'trx_bet_data';
const CHART_URL = 'https://trx-chart.pages.dev';

document.addEventListener('DOMContentLoaded', async () => {
  // Check connection
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
  
  // Buttons
  document.getElementById('openChart').addEventListener('click', () => {
    chrome.tabs.create({ url: CHART_URL });
  });
  
  document.getElementById('syncNow').addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ url: 'https://6win598.com/*' });
    if (tabs.length === 0) {
      alert('Please open 6win598.com first!');
      return;
    }
    chrome.tabs.reload(tabs[0].id);
    window.close();
  });
  
  document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('Clear all bet data?\nThis cannot be undone.')) {
      chrome.storage.local.set({ [STORAGE_KEY]: { bets: [], balance: 0 } }, () => {
        loadStats();
        alert('Data cleared!');
      });
    }
  });
});

function loadStats() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const data = result[STORAGE_KEY] || { bets: [], balance: 0 };
    document.getElementById('totalBets').textContent = data.bets.length;
    document.getElementById('balance').textContent = 
      data.balance ? data.balance.toFixed(0) : '0';
  });
}
