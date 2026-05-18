(function() {
  console.log('🎯 [TRX Page] Interceptor active');
  
  const API_KEYWORDS = ['lotteryapi', '6lottery', 'Emerd', 'Bet', 'Order'];
  
  function isTarget(url) {
    return API_KEYWORDS.some(k => url.includes(k));
  }
  
  // Fetch interceptor
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const opts = args[1] || {};
    
    if (isTarget(url)) {
      console.log('🔍 [TRX] Fetch:', url);
    }
    
    const response = await originalFetch.apply(this, args);
    
    if (!isTarget(url)) return response;
    
    try {
      const cloned = response.clone();
      const data = await cloned.json();
      console.log('📦 [TRX] Response:', url.split('?')[0].split('/').pop(), data);
      
      window.postMessage({
        source: 'trx-page',
        url: url,
        data: data,
        body: opts.body || null,
        timestamp: Date.now()
      }, '*');
    } catch(e) {}
    
    return response;
  };
  
  // XHR interceptor
  const OrigXHR = window.XMLHttpRequest;
  const origOpen = OrigXHR.prototype.open;
  const origSend = OrigXHR.prototype.send;
  
  OrigXHR.prototype.open = function(method, url, ...rest) {
    this._trxUrl = url;
    this._trxMethod = method;
    return origOpen.apply(this, [method, url, ...rest]);
  };
  
  OrigXHR.prototype.send = function(body) {
    const xhr = this;
    if (xhr._trxUrl && isTarget(xhr._trxUrl)) {
      console.log('🔍 [TRX] XHR:', xhr._trxUrl);
      xhr.addEventListener('load', function() {
        try {
          const data = JSON.parse(xhr.responseText);
          console.log('📦 [TRX] XHR Response:', xhr._trxUrl.split('/').pop(), data);
          
          window.postMessage({
            source: 'trx-page',
            url: xhr._trxUrl,
            data: data,
            body: body || null,
            timestamp: Date.now()
          }, '*');
        } catch(e) {}
      });
    }
    return origSend.apply(this, [body]);
  };
  
  console.log('✅ [TRX Page] Fetch + XHR interceptors ready');
})();
