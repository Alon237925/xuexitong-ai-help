const apiKeyInput = document.getElementById('apiKey');
const apiUrlInput = document.getElementById('apiUrl');
const modelInput = document.getElementById('model');
const enabledInput = document.getElementById('enabled');
const autoSubmitInput = document.getElementById('autoSubmit');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const statusMsg = document.getElementById('statusMsg');

function showStatus(text, isError = false) {
  statusMsg.style.color = isError ? '#f87171' : '#34d399';
  statusMsg.textContent = text;
}

// 聚焦时显示明文方便核对，失焦恢复密码掩码
apiKeyInput.addEventListener('focus', () => {
  apiKeyInput.type = 'text';
});
apiKeyInput.addEventListener('blur', () => {
  apiKeyInput.type = 'password';
});

// 读取已保存的配置
chrome.storage.local.get(
  ['API_URL', 'API_KEY', 'MODEL', 'AUTO_SUBMIT_WORK', 'ENABLED'],
  (res) => {
    if (res.API_URL) apiUrlInput.value = res.API_URL;
    if (res.API_KEY) apiKeyInput.value = res.API_KEY;
    if (res.MODEL) modelInput.value = res.MODEL;
    if (typeof res.AUTO_SUBMIT_WORK === 'boolean') autoSubmitInput.checked = res.AUTO_SUBMIT_WORK;
    if (typeof res.ENABLED === 'boolean') enabledInput.checked = res.ENABLED;
  }
);

saveBtn.addEventListener('click', () => {
  const cfg = {
    API_URL: apiUrlInput.value.trim() || 'https://api.deepseek.com/chat/completions',
    API_KEY: apiKeyInput.value.trim(),
    MODEL: modelInput.value.trim() || 'deepseek-flash',
    AUTO_SUBMIT_WORK: autoSubmitInput.checked,
    ENABLED: enabledInput.checked
  };

  chrome.storage.local.set(cfg, async () => {
    showStatus('✅ 配置已保存！正在同步到当前标签页...');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
        chrome.tabs.sendMessage(tab.id, { type: 'CHAOXING_FORCE_RESTART' }, () => {
          if (chrome.runtime.lastError) {
            // 如果当前页面是在安装插件前打开的，主动注入 content.js
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            }).catch(() => {});
          }
        });
      }
    } catch (e) {}
  });
});

testBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  const apiUrl = apiUrlInput.value.trim() || 'https://api.deepseek.com/chat/completions';
  const model = modelInput.value.trim() || 'deepseek-flash';

  if (!apiKey || apiKey.includes('在这里填入')) {
    showStatus('⚠️ 请先填写有效的 API_KEY', true);
    return;
  }

  showStatus('⏳ 正在测试 AI 接口连通性...');
  chrome.runtime.sendMessage(
    {
      type: 'CHAOXING_AI_FETCH',
      payload: {
        apiUrl,
        apiKey,
        model,
        prompt: '本题为【单选题】，只输出唯一正确选项的单个字母（例如：A）。1+1等于几？\nA. 2\nB. 3'
      }
    },
    (res) => {
      if (chrome.runtime.lastError) {
        showStatus(`❌ 请求异常: ${chrome.runtime.lastError.message}`, true);
        return;
      }
      if (res && res.ok) {
        showStatus(`✅ 连通成功！AI 返回测试结果: [${res.answer}]`);
      } else {
        showStatus(`❌ 接口报错: ${res?.error || '未知错误'}`, true);
      }
    }
  );
});
