(function () {
  if (window.__chaoxingV7ContentLoaded) return;
  window.__chaoxingV7ContentLoaded = true;

  const CONFIG_KEYS = ['API_URL', 'API_KEY', 'MODEL', 'AUTO_SUBMIT_WORK', 'ENABLED'];

  function sendConfigToPage(config, forceRestart = false) {
    window.postMessage(
      {
        source: 'CHAOXING_V7_CONTENT',
        type: 'CONFIG_UPDATE',
        config,
        forceRestart
      },
      '*'
    );
  }

  function injectMainScript() {
    chrome.storage.local.get(CONFIG_KEYS, (stored) => {
      const config = {
        API_URL: stored.API_URL || 'https://api.deepseek.com/chat/completions',
        API_KEY: stored.API_KEY || '',
        MODEL: stored.MODEL || 'deepseek-flash',
        AUTO_SUBMIT_WORK: stored.AUTO_SUBMIT_WORK !== undefined ? stored.AUTO_SUBMIT_WORK : true,
        ENABLED: stored.ENABLED !== undefined ? stored.ENABLED : true
      };

      const existing = document.getElementById('__chaoxing_v7_injected_script');
      if (existing) {
        sendConfigToPage(config, true);
        return;
      }

      const script = document.createElement('script');
      script.id = '__chaoxing_v7_injected_script';
      script.src = chrome.runtime.getURL('injected.js');
      script.onload = () => {
        sendConfigToPage(config, false);
      };
      (document.head || document.documentElement).appendChild(script);
    });
  }

  // 监听来自 injected.js 的消息（AI 请求代理 & 状态同步）
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'CHAOXING_V7_INJECTED') return;

    if (event.data.type === 'AI_FETCH') {
      const { reqId, payload } = event.data;
      chrome.runtime.sendMessage(
        {
          type: 'CHAOXING_AI_FETCH',
          payload
        },
        (response) => {
          if (chrome.runtime.lastError) {
            window.postMessage(
              {
                source: 'CHAOXING_V7_CONTENT',
                type: 'AI_FETCH_RESULT',
                reqId,
                ok: false,
                error: chrome.runtime.lastError.message
              },
              '*'
            );
            return;
          }
          window.postMessage(
            {
              source: 'CHAOXING_V7_CONTENT',
              type: 'AI_FETCH_RESULT',
              reqId,
              ok: Boolean(response && response.ok),
              answer: response?.answer || '',
              error: response?.error || ''
            },
            '*'
          );
        }
      );
    } else if (event.data.type === 'SET_ENABLED') {
      chrome.storage.local.set({ ENABLED: Boolean(event.data.enabled) });
    }
  });

  // 监听插件弹窗的实时配置修改
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    chrome.storage.local.get(CONFIG_KEYS, (stored) => {
      sendConfigToPage(stored, false);
    });
  });

  // 监听来自 popup.js 的手动立即启动指令
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'CHAOXING_FORCE_RESTART') {
      injectMainScript();
      sendResponse({ ok: true });
    }
  });

  injectMainScript();
})();
