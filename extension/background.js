// ============================================
// CLOUD SYNC CONFIG
// ============================================
const SYNC_URL = "https://trx-chart.pages.dev/api/tracker-sync";
const USER_ID = "warwarzc";
const SYNC_TOKEN = "trx-sync-9f31d2c4a7b8e1x5m2k";

let syncTimer = null;

function queueSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncTrackerState, 1500);
}

async function syncTrackerState() {
  try {
    const data = await chrome.storage.local.get(["trx_bets", "trx_balance"]);

    const payload = {
      userId: USER_ID,
      balance: Number(data.trx_balance || 0),
      bets: Array.isArray(data.trx_bets) ? data.trx_bets : []
    };

    const res = await fetch(SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SYNC_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("[Sync] Failed:", res.status, await res.text());
      return;
    }

    console.log("[Sync] ✅ Cloud sync OK -", payload.bets.length, "bets");
  } catch (err) {
    console.error("[Sync] Error:", err);
  }
}
// ============================================
// END CLOUD SYNC CONFIG
// ============================================


// ═══════════════════════════════════════════════════
// TRX Chart Companion - Background Service Worker v3
// ═══════════════════════════════════════════════════

console.log('🎯 [TRX BG] Service worker started v3');

const CHART_ORIGIN = 'https://trx-chart.pages.dev';
const STORAGE_KEY = 'trx_bets';
const MAX_BETS = 5000;

// Map selectType code -> label
function mapSelectType(code) {
  const map = {
    1: 'green',
    2: 'red',
    3: 'violet',
    13: 'big',
    14: 'small',
  };
  return map[code] || ('type_' + code);
}

// ============ Listen for messages from content script ============
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'API_CAPTURED') {
    handleApiCapture(msg);
    sendResponse({ ok: true });
  }
  else if (msg.type === 'GET_BETS') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      sendResponse({ bets: result[STORAGE_KEY] || [] });
    });
    return true;
  }
  else if (msg.type === 'CLEAR_BETS') {
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      sendResponse({ ok: true });
      queueSync();
    });
    return true;
  }
  return true;
});

// ============ Handle captured API data ============
function handleApiCapture(msg) {
  const { url, data, body } = msg;
  
  if (!data) return;
  
  if (url.includes('GameTRXBetting')) {
    if (data.code === 0 && body) {
      handleBetPlacement(body);
    }
    return;
  }
  
  if (url.includes('GetTRXMyEmerdList')) {
    if (data.code !== 0) return;
    const list = data.data?.list || [];
    if (list.length > 0) {
      saveBetsFromHistory(list);
    }
  }
  else if (url.includes('GetTRXNoaverageEmerdList')) {
    if (data.code !== 0) return;
    const list = data.data?.data?.gameslist || data.data?.gameslist || data.data?.list || [];
    if (list.length > 0) {
      console.log('[TRX BG] Got', list.length, 'results, resolving pending bets...');
      resolvePendingBets(list);
    }
  }
  else if (url.includes('GetBalance')) {
    if (data.code !== 0) return;
    chrome.storage.local.set({ 
      trx_balance: data.data,
      trx_balance_time: Date.now()
    }, () => {
      queueSync();
    });
  }
}

// ============ Handle bet placement from GameTRXBetting ============
function handleBetPlacement(bodyStr) {
  let body;
  try {
    body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr;
  } catch(e) {
    console.warn('[TRX BG] Cannot parse bet body:', e);
    return;
  }
  
  if (!body.issuenumber) return;
  
  const selectTypeLabel = mapSelectType(body.selectType);
  const betCount = parseFloat(body.betCount) || 1;
  const baseAmount = parseFloat(body.amount) / 100;
  const totalAmount = baseAmount * betCount;
  
  const bet = {
    orderNumber: 'TWG' + body.issuenumber + '_' + Date.now(),
    issueNumber: body.issuenumber,
    period: body.issuenumber,
    amount: totalAmount,
    realAmount: totalAmount,
    fee: 0,
    profit: 0,
    selectType: selectTypeLabel,
    rawSelectType: body.selectType,
    colour: '',
    number: null,
    state: null,
    status: 'pending',
    addTime: new Date().toISOString().replace('T',' ').substring(0, 19),
    timestamp: Date.now()
  };
  
  console.log('[TRX BG] New bet placed:', bet);
  
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const existing = result[STORAGE_KEY] || [];
    
    const dupCheck = existing.find(b => 
      b.period === bet.period && b.selectType === bet.selectType
    );
    if (dupCheck) {
      console.log('[TRX BG] Duplicate bet skipped');
      return;
    }
    
    const all = [bet, ...existing]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_BETS);
    
    chrome.storage.local.set({ [STORAGE_KEY]: all }, () => {
      console.log('[TRX BG] Bet saved. Total:', all.length);
      updateBadge(all);
      queueSync();
    });
  });
}

// ============ Auto-resolve pending bets when results come ============
function resolvePendingBets(resultsList) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const bets = result[STORAGE_KEY] || [];
    let updated = 0;
    
    for (const r of resultsList) {
      const period = r.issueNumber || r.period;
      const resultNumber = r.number !== undefined ? String(r.number) : null;
      if (!period || resultNumber === null) continue;
      
      for (const bet of bets) {
        if (bet.status !== 'pending') continue;
        if (bet.period !== period) continue;
        
        const num = parseInt(resultNumber);
        const isBig = num >= 5;
        const isSmall = num <= 4;
        
        let isWin = false;
        if (bet.selectType === 'big' && isBig) isWin = true;
        else if (bet.selectType === 'small' && isSmall) isWin = true;
        
        bet.number = resultNumber;
        bet.state = isWin ? 1 : 0;
        bet.status = isWin ? 'win' : 'loss';
        bet.profit = isWin ? (bet.amount * 0.98) : -bet.amount;
        
        updated++;
        console.log('[TRX BG] Resolved bet:', bet.period, bet.selectType, '->', bet.status);
      }
    }
    
    if (updated > 0) {
      chrome.storage.local.set({ [STORAGE_KEY]: bets }, () => {
        console.log('[TRX BG] Resolved', updated, 'pending bets');
        queueSync();
      });
    }
  });
}

// ============ Save bets from history API ============
function saveBetsFromHistory(newBets) {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const existing = result[STORAGE_KEY] || [];
    const existingByOrder = new Map(existing.map(b => [b.orderNumber, b]));
    
    let added = 0, updated = 0;
    
    for (const b of newBets) {
      const normalized = {
        orderNumber: b.orderNumber,
        issueNumber: b.issueNumber,
        period: b.issueNumber,
        amount: parseFloat(b.amount) / 100,
        realAmount: parseFloat(b.realAmount) / 100,
        fee: parseFloat(b.fee) / 100,
        profit: parseFloat(b.profitAmount) / 100,
        selectType: b.selectType,
        rawSelectType: b.selectType,
        colour: b.colour,
        number: b.number,
        state: b.state,
        status: b.state === 1 ? 'win' : (b.state === 0 ? 'loss' : 'pending'),
        addTime: b.addTime,
        timestamp: new Date(b.addTime).getTime()
      };
      
      if (existingByOrder.has(b.orderNumber)) {
        const old = existingByOrder.get(b.orderNumber);
        Object.assign(old, normalized);
        updated++;
      } else {
        const dup = existing.find(e => 
          e.period === normalized.period && 
          e.selectType === normalized.selectType &&
          e.orderNumber.includes('_')
        );
        if (dup) {
          Object.assign(dup, normalized);
          updated++;
        } else {
          existing.push(normalized);
          existingByOrder.set(b.orderNumber, normalized);
          added++;
        }
      }
    }
    
    if (added === 0 && updated === 0) return;
    
    const all = existing
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_BETS);
    
    chrome.storage.local.set({ [STORAGE_KEY]: all }, () => {
      console.log(`[TRX BG] History sync: +${added} new, ${updated} updated (total: ${all.length})`);
      updateBadge(all);
      queueSync();
    });
  });
}

// ============ Update extension badge ============
function updateBadge(bets) {
  const today = new Date().toDateString();
  const todayBets = bets.filter(b => 
    new Date(b.timestamp).toDateString() === today
  );
  
  chrome.action.setBadgeText({ 
    text: todayBets.length > 0 ? String(todayBets.length) : '' 
  });
  chrome.action.setBadgeBackgroundColor({ color: '#00e5ff' });
}

// ============ External messaging (from chart app) ============
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  if (sender.origin !== CHART_ORIGIN) {
    sendResponse({ error: 'Unauthorized' });
    return;
  }
  
  if (msg.type === 'GET_BETS') {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      sendResponse({ 
        bets: result[STORAGE_KEY] || [],
        balance: result.trx_balance || null
      });
    });
    return true;
  }
  else if (msg.type === 'PING') {
    sendResponse({ ok: true, version: '1.0.3' });
  }
});

console.log('✅ [TRX BG] Ready v3 + Cloud Sync');
