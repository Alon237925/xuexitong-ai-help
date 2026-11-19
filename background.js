const DEFAULT_CONFIG = {
  API_URL: 'https://api.deepseek.com/chat/completions',
  API_KEY: '',
  MODEL: 'deepseek-flash',
  AUTO_SUBMIT_WORK: true,
  ENABLED: true
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(Object.keys(DEFAULT_CONFIG), (res) => {
    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULT_CONFIG)) {
      if (res[k] === undefined) toSet[k] = v;
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CHAOXING_AI_FETCH') {
    const { apiUrl, apiKey, model, prompt } = message.payload || {};
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      }),
      signal: controller.signal
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}${errText ? ': ' + errText.slice(0, 120) : ''}`);
        }
        return res.json();
      })
      .then((data) => {
        const msg = data.choices?.[0]?.message || {};
        const ans = (msg.content || msg.reasoning_content || '').trim();
        sendResponse({ ok: true, answer: ans });
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        sendResponse({ ok: false, error: err.message || '请求失败' });
      });

    return true; // 保持异步消息通道
  }
});
