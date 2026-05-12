// ═══════════════════════════════════════════════════
// TRX Chart Companion - Background Service Worker
// Stores bet data and communicates with chart app
// ═══════════════════════════════════════════════════

console.log('🎯 [TRX BG] Background started');

const STORAGE_KEY = 'trx_bet_data';
const CHART_ORIGIN = 'https://trx-chart.pages.dev';

// ============ Listen from content script ============
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🎯 [TRX BG] Message:', message.type);
  
  switch(message.type) {
    case 'BET_HISTORY':
      saveBetHistory(message.bets);
      break;
    case 'BET_PLACED':
      saveBetPlaced(message.bet);
      break;
    case 'BALANCE_UPDATE':
      saveBalance(message.balance);
      break;
  }
  
  sendResponse({ ok: true });
  return true;
});

// ============ External (from chart app) ============
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('🎯 [TRX BG] External:', message);
  
  if (message.action === 'getBets') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      sendResponse({
        success: true,
        data: result[STORAGE_KEY] || { bets: [], balance: 0 }
      });
    });
    return true;
  }
  
  if (message.action === 'clearBets') {
    chrome.storage.local.set({ [STORAGE_KEY]: { bets: [], balance: 0 } });
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'ping') {
    sendResponse({ success: true, version: '1.0.0' });
    return true;
  }
});

// ============ Save Functions ============
function saveBetHistory(newBets) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const data = result[STORAGE_KEY] || { bets: [], balance: 0 };
    
    // Merge by orderId (dedupe)
    const existingIds = new Set(data.bets.map(b => b.orderId));
    const additions = newBets.filter(b => !existingIds.has(b.orderId));
    
    data.bets = [...data.bets, ...additions]
      .sort((a, b) => (b.createTime || 0) - (a.createTime || 0))
      .slice(0, 1000); // Keep last 1000
    
    data.lastUpdate = Date.now();
    
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      console.log(`💾 Saved ${additions.length} new bets (total: ${data.bets.length})`);
      notifyChart(data);
    });
  });
}

function saveBetPlaced(bet) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const data = result[STORAGE_KEY] || { bets: [], balance: 0 };
    data.lastBet = bet;
    data.lastBetTime = Date.now();
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      notifyChart(data);
    });
  });
}

function saveBalance(balance) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const data = result[STORAGE_KEY] || { bets: [], balance: 0 };
    data.balance = balance;
    data.balanceUpdate = Date.now();
    chrome.storage.local.set({ [STORAGE_KEY]: data });
  });
}

function notifyChart(data) {
  // Find all chart tabs and send update
  chrome.tabs.query({ url: CHART_ORIGIN + '/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'TRX_BET_UPDATE',
        data: data
      }).catch(() => {
        // Tab might not have content script
      });
    });
  });
}

console.log('✅ [TRX BG] Ready');
