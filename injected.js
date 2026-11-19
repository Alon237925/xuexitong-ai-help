(function initChaoxingFullAutoAIV7() {
  // ================= 1. 默认配置（可在插件弹窗中直接修改并保存，也可在此处直接填入） =================
  const AI_CONFIG = Object.assign(
    {
      API_URL: 'https://api.deepseek.com/chat/completions',
      API_KEY: 'sk-在这里填入你的API_KEY',
      MODEL: 'deepseek-flash',
      AUTO_SUBMIT_WORK: true, // 全部题目校验勾选后，自动点击“提交”并确认交卷
      ENABLED: true
    },
    window.__CHAOXING_EXT_CONFIG__ || {}
  );
  // ==============================================================================================

  // 停止旧版本所有的定时器与循环
  if (window.__chaoxingAutoTimer) {
    clearInterval(window.__chaoxingAutoTimer);
    window.__chaoxingAutoTimer = null;
  }
  window.__chaoxingRunningId = 0;

  function startNewMainLoop() {
    const newRunId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    window.__chaoxingRunningId = newRunId;
    mainLoop(newRunId);
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 日志输出与页面悬浮窗同步
  function logMsg(msg) {
    console.log(msg);
    try {
      const logBox = document.getElementById('__cx_v7_log_list');
      if (logBox) {
        const item = document.createElement('div');
        item.style.cssText = 'padding:3px 0;border-bottom:1px dashed rgba(255,255,255,0.1);word-break:break-all;';
        const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        item.textContent = `[${timeStr}] ${msg}`;
        logBox.appendChild(item);
        while (logBox.children.length > 40) {
          logBox.removeChild(logBox.firstChild);
        }
        logBox.scrollTop = logBox.scrollHeight;
      }
    } catch (e) {}
  }

  function updatePanelStatus() {
    try {
      const badge = document.getElementById('__cx_v7_status_badge');
      const toggleBtn = document.getElementById('__cx_v7_toggle_btn');
      const keyStatus = document.getElementById('__cx_v7_key_status');
      const hasKey = AI_CONFIG.API_KEY && !AI_CONFIG.API_KEY.includes('在这里填入');
      if (badge) {
        badge.textContent = AI_CONFIG.ENABLED ? '运行中' : '已暂停';
        badge.style.background = AI_CONFIG.ENABLED ? '#10b981' : '#f59e0b';
      }
      if (toggleBtn) {
        toggleBtn.textContent = AI_CONFIG.ENABLED ? '⏸ 暂停挂机' : '▶ 继续挂机';
        toggleBtn.style.background = AI_CONFIG.ENABLED ? '#ef4444' : '#2563eb';
      }
      if (keyStatus) {
        keyStatus.textContent = hasKey
          ? `✅ Key 已配置 (${AI_CONFIG.MODEL})`
          : '⚠️ 未配置 API_KEY（请点击浏览器右上角插件图标填入）';
        keyStatus.style.color = hasKey ? '#6ee7b7' : '#fcd34d';
      }
    } catch (e) {}
  }

  function mountStatusPanel() {
    if (window !== window.top) return;
    if (document.getElementById('__cx_v7_panel')) {
      updatePanelStatus();
      return;
    }
    const panel = document.createElement('div');
    panel.id = '__cx_v7_panel';
    panel.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'width:320px',
      'background:rgba(15, 23, 42, 0.92)',
      'color:#f8fafc',
      'border:1px solid rgba(59, 130, 246, 0.5)',
      'border-radius:10px',
      'box-shadow:0 8px 24px rgba(0,0,0,0.35)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
      'font-size:12px',
      'z-index:2147483647',
      'backdrop-filter:blur(6px)',
      'overflow:hidden'
    ].join(';');

    panel.innerHTML = `
      <div id="__cx_v7_header" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(30, 41, 59, 0.95);cursor:move;user-select:none;border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px;">
          <span>🤖 学习通 AI 助手 V7</span>
          <span id="__cx_v7_status_badge" style="font-size:11px;padding:1px 6px;border-radius:99px;background:#10b981;color:#fff;">运行中</span>
        </div>
        <div style="display:flex;gap:6px;">
          <button id="__cx_v7_min_btn" title="折叠/展开" style="background:transparent;border:none;color:#cbd5e1;cursor:pointer;font-size:14px;line-height:1;padding:2px 4px;">—</button>
        </div>
      </div>
      <div id="__cx_v7_body" style="padding:10px 12px;">
        <div id="__cx_v7_key_status" style="margin-bottom:8px;font-size:11px;"></div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <button id="__cx_v7_toggle_btn" style="flex:1;padding:5px 8px;border:none;border-radius:6px;background:#ef4444;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">⏸ 暂停挂机</button>
        </div>
        <div id="__cx_v7_log_list" style="height:120px;overflow-y:auto;background:rgba(2, 6, 23, 0.65);border-radius:6px;padding:6px 8px;font-size:11px;line-height:1.45;color:#e2e8f0;"></div>
      </div>
    `;

    document.body.appendChild(panel);
    updatePanelStatus();

    const minBtn = document.getElementById('__cx_v7_min_btn');
    const bodyEl = document.getElementById('__cx_v7_body');
    if (minBtn && bodyEl) {
      minBtn.addEventListener('click', () => {
        const hidden = bodyEl.style.display === 'none';
        bodyEl.style.display = hidden ? 'block' : 'none';
        minBtn.textContent = hidden ? '—' : '□';
      });
    }

    const toggleBtn = document.getElementById('__cx_v7_toggle_btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        AI_CONFIG.ENABLED = !AI_CONFIG.ENABLED;
        window.postMessage(
          {
            source: 'CHAOXING_V7_INJECTED',
            type: 'SET_ENABLED',
            enabled: AI_CONFIG.ENABLED
          },
          '*'
        );
        updatePanelStatus();
        if (AI_CONFIG.ENABLED) {
          logMsg('▶️ 已恢复全自动挂机巡检...');
          startNewMainLoop();
        } else {
          logMsg('⏸️ 已暂停自动挂机。');
          window.__chaoxingRunningId = 0;
        }
      });
    }
  }

  // 监听来自 content.js 的配置更新与启停指令
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'CHAOXING_V7_CONTENT') return;
    if (event.data.type === 'CONFIG_UPDATE') {
      const prevEnabled = AI_CONFIG.ENABLED;
      const cfg = event.data.config || {};
      if (cfg.API_URL) AI_CONFIG.API_URL = cfg.API_URL;
      if (cfg.API_KEY !== undefined && cfg.API_KEY !== '') AI_CONFIG.API_KEY = cfg.API_KEY;
      if (cfg.MODEL) AI_CONFIG.MODEL = cfg.MODEL;
      if (typeof cfg.AUTO_SUBMIT_WORK === 'boolean') AI_CONFIG.AUTO_SUBMIT_WORK = cfg.AUTO_SUBMIT_WORK;
      if (typeof cfg.ENABLED === 'boolean') AI_CONFIG.ENABLED = cfg.ENABLED;

      updatePanelStatus();

      if (AI_CONFIG.ENABLED && (!prevEnabled || event.data.forceRestart)) {
        logMsg('🔄 配置已更新，正在启动 V7 顺序防抢跑巡检...');
        startNewMainLoop();
      } else if (!AI_CONFIG.ENABLED) {
        logMsg('⏸️ 脚本已暂停。');
        window.__chaoxingRunningId = 0;
      }
    }
  });

  function getAllWindows(win = window) {
    let wins = [win];
    try {
      const iframes = win.document.querySelectorAll('iframe');
      iframes.forEach(f => {
        if (f.contentWindow) wins = wins.concat(getAllWindows(f.contentWindow));
      });
    } catch (e) {}
    return wins;
  }

  function stripAriaHidden(doc) {
    try {
      doc.querySelectorAll('[aria-hidden]').forEach(el => el.removeAttribute('aria-hidden'));
      doc.querySelectorAll('.Zy_ulTop, .Zy_ulTop li, .Zy_ulBottom li').forEach(el => {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('tabindex');
      });
    } catch (e) {}
  }

  function patchWindowEnvironment(wins) {
    wins.forEach(w => {
      try {
        stripAriaHidden(w.document);
        if (!w.__envPatchedV7) {
          const origSetAttr = w.Element.prototype.setAttribute;
          w.Element.prototype.setAttribute = function (name, value) {
            if (typeof name === 'string' && name.toLowerCase() === 'aria-hidden') return;
            return origSetAttr.call(this, name, value);
          };

          w.console.warn = function () {};

          const origFunc = w.Function.prototype.constructor;
          w.Function.prototype.constructor = function (...args) {
            if (args.length && typeof args[args.length - 1] === 'string') {
              args[args.length - 1] = args[args.length - 1].replace(/debugger/g, '');
            }
            return origFunc.apply(this, args);
          };

          const origSetInterval = w.setInterval;
          w.setInterval = function (fn, delay, ...rest) {
            if (typeof fn === 'string' && fn.includes('debugger')) {
              fn = fn.replace(/debugger/g, '');
            }
            return origSetInterval.call(w, fn, delay, ...rest);
          };

          ['mouseout', 'mouseleave', 'blur', 'visibilitychange', 'webkitvisibilitychange'].forEach(evt => {
            w.addEventListener(evt, e => e.stopImmediatePropagation(), true);
            w.document.addEventListener(evt, e => e.stopImmediatePropagation(), true);
          });

          Object.defineProperty(w.document, 'hidden', { get: () => false, configurable: true });
          Object.defineProperty(w.document, 'visibilityState', { get: () => 'visible', configurable: true });
          w.__envPatchedV7 = true;
        }
      } catch (e) {}
    });
  }

  // 记录已完成一轮 AI 答题的章节，以及每章节点击“去学习”的次数（避免死循环）
  const chapterAiDoneSet = new Set();
  const chapterStayCountMap = new Map();

  function getCurrentChapterKey(wins) {
    for (const w of wins) {
      try {
        const activeCatalog = w.document.querySelector('.posCatalog_active, .currents, li.active[id^="cur"]');
        if (activeCatalog) {
          const id = activeCatalog.id || activeCatalog.getAttribute('onclick') || '';
          const title = (activeCatalog.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40);
          if (id || title) return `${id}|${title}`;
        }
        const chapInput = w.document.querySelector('#chapterIdid, input[name="chapterId"]');
        if (chapInput && chapInput.value) return `chap_${chapInput.value}`;
      } catch (e) {}
    }
    return location.href;
  }

  function hasUnansweredQuizInWins(wins) {
    for (const w of wins) {
      try {
        const allQuestions = Array.from(w.document.querySelectorAll('.TiMu, .questionLi')).filter(
          q => q.offsetParent !== null
        );
        if (allQuestions.length === 0) continue;
        const submitBtn = findQuizSubmitButton(w.document);
        if (!submitBtn) continue;
        if (allQuestions.some(q => !isQuestionAnsweredInDOM(q))) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  function findContinueNextBtnInModal(goStudyBtn) {
    const priorityTexts = ['继续下一节', '继续学习下一节', '下一节', '继续', '仍然进入', '跳过'];
    let container = goStudyBtn.parentElement;
    for (let depth = 0; depth < 5 && container; depth++) {
      const candidates = Array.from(container.querySelectorAll('a, button, span, div')).filter(el => {
        if (el === goStudyBtn || el.contains(goStudyBtn) || goStudyBtn.contains(el)) return false;
        return el.offsetParent !== null && el.children.length === 0;
      });
      for (const targetText of priorityTexts) {
        const matched = candidates.find(el => (el.innerText || '').trim() === targetText);
        if (matched) return matched;
      }
      const fuzzy = candidates.find(el => {
        const t = (el.innerText || '').trim();
        return t.length <= 10 && /(继续|下一节|跳过)/.test(t) && !t.includes('去学习');
      });
      if (fuzzy) return fuzzy;
      container = container.parentElement;
    }
    return null;
  }

  // 处理“当前章节还有任务点未完成”弹窗：
  // - 若 AI 已在本节完成一轮答题（或已尝试“去学习”且本节无未答题目），直接点【继续下一节】
  // - 若尚未答题，则点【去学习】留在本节完成测验
  function handleUnfinishedTaskModal(wins) {
    const chapterKey = getCurrentChapterKey(wins);
    const aiDoneThisChapter = chapterAiDoneSet.has(chapterKey);
    const stayCount = chapterStayCountMap.get(chapterKey) || 0;
    const stillHasUnanswered = hasUnansweredQuizInWins(wins);

    for (const w of wins) {
      try {
        const btns = Array.from(w.document.querySelectorAll('a, button, span, div'));
        const goStudyBtn = btns.find(el => {
          const t = (el.innerText || '').trim();
          return t === '去学习' && el.offsetParent !== null && el.children.length === 0;
        });
        if (!goStudyBtn) continue;

        const shouldContinueNext = aiDoneThisChapter || (stayCount >= 1 && !stillHasUnanswered);
        if (shouldContinueNext) {
          const continueBtn = findContinueNextBtnInModal(goStudyBtn);
          if (continueBtn) {
            const btnText = (continueBtn.innerText || '').trim();
            logMsg(`⏭️ 本节 AI 已完成一轮作答，检测到“任务点未完成”弹窗，自动点击【${btnText}】...`);
            continueBtn.click();
            if (continueBtn.parentElement && continueBtn.tagName === 'SPAN') {
              continueBtn.parentElement.click();
            }
            return true;
          }
        }

        chapterStayCountMap.set(chapterKey, stayCount + 1);
        logMsg('🔄 检测到“任务点未完成”提示窗，本节尚有未作答任务，自动点击【去学习】继续完成...');
        goStudyBtn.click();
        if (goStudyBtn.parentElement && goStudyBtn.tagName === 'SPAN') {
          goStudyBtn.parentElement.click();
        }
        return true;
      } catch (e) {}
    }
    return false;
  }

  // 通过插件后台 Service Worker 代理请求 AI（规避页面 CSP 与跨域限制），失败时回退至直接 fetch
  function fetchAIViaExtensionBridge(prompt) {
    return new Promise((resolve, reject) => {
      const reqId = 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const timer = setTimeout(() => {
        window.removeEventListener('message', onMsg);
        reject(new Error('Bridge timeout'));
      }, 16000);

      function onMsg(event) {
        if (
          event.source === window &&
          event.data &&
          event.data.source === 'CHAOXING_V7_CONTENT' &&
          event.data.type === 'AI_FETCH_RESULT' &&
          event.data.reqId === reqId
        ) {
          clearTimeout(timer);
          window.removeEventListener('message', onMsg);
          if (event.data.ok) {
            resolve(event.data.answer);
          } else {
            reject(new Error(event.data.error || 'AI 请求失败'));
          }
        }
      }

      window.addEventListener('message', onMsg);
      window.postMessage(
        {
          source: 'CHAOXING_V7_INJECTED',
          type: 'AI_FETCH',
          reqId,
          payload: {
            apiUrl: AI_CONFIG.API_URL,
            apiKey: AI_CONFIG.API_KEY,
            model: AI_CONFIG.MODEL,
            prompt
          }
        },
        '*'
      );
    });
  }

  // 调用 AI 接口（带 15 秒超时与 3 次重试）
  async function askAI(questionText, optionsText, qType = 'SINGLE') {
    if (!AI_CONFIG.API_KEY || AI_CONFIG.API_KEY.includes('在这里填入')) {
      logMsg('ℹ️ 请先点击浏览器右上角插件图标填写有效的 API_KEY');
      return null;
    }

    let formatRule = '';
    if (qType === 'MULTI') {
      formatRule = '本题为【多选题】，只输出所有正确选项的字母组合（例如：ACD 或 ABCD），不要有任何标点、空格或解释。';
    } else if (qType === 'JUDGE') {
      formatRule = '本题为【判断题】，只输出“对”或“错”一个字，不要有任何其他字符。';
    } else if (qType === 'FILL') {
      formatRule = '本题为【填空/简答题】，直接给出准确答案；若有多个空请用 | 分隔，不要输出多余解释。';
    } else {
      formatRule = '本题为【单选题】，只输出唯一正确选项的单个字母（例如：A），绝对不要输出多个字母或任何解释。';
    }

    const prompt = `你是一个专业课程助教。注意：以下题目和选项文本可能包含超星学习通的字体加密乱码（部分汉字被替换成了字形或读音相近的生僻字，例如“孉孋双方”代表“恋爱双方”，“孢要拥有敩”代表“只要拥有你”）。请先根据上下文自动还原真实语义，再作答。
严格输出要求：${formatRule}

【题目】：
${questionText}
${optionsText ? `\n【选项】：\n${optionsText}` : ''}`;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let ans = '';
        try {
          ans = await fetchAIViaExtensionBridge(prompt);
        } catch (bridgeErr) {
          const errMsg = bridgeErr?.message || '';
          const isBridgeTransportErr =
            /Bridge timeout|Extension context invalidated|Receiving end does not exist|Could not establish connection/i.test(
              errMsg
            );
          if (!isBridgeTransportErr) {
            throw bridgeErr;
          }
          // 仅在插件桥接通信失败时回退到页面直接 fetch
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          try {
            const res = await fetch(AI_CONFIG.API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.API_KEY}`
              },
              body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
              }),
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const msg = data.choices?.[0]?.message || {};
            ans = (msg.content || msg.reasoning_content || '').trim();
          } catch (fetchErr) {
            clearTimeout(timeoutId);
            throw fetchErr;
          }
        }

        if (ans) {
          logMsg(`🤖 AI 答案(${qType}): [${ans}] | 题目: ${questionText.slice(0, 28)}...`);
          return ans;
        }
        throw new Error('AI 返回内容为空');
      } catch (e) {
        logMsg(`🔄 第 ${attempt}/3 次 AI 请求重试中 (${e.message})...`);
        if (attempt < 3) await sleep(2000);
      }
    }
    return null;
  }

  // 获取题目下的所有选项 DOM 元素
  function getOptionElements(qEl) {
    let opts = Array.from(
      qEl.querySelectorAll(
        '.Zy_ulTop > li, .Zy_ulBottom > li, .stem_answer .answerBg, .stem_answer > div, .qtDetail > li, .mark_letter > li'
      )
    );
    if (opts.length === 0) {
      opts = Array.from(qEl.querySelectorAll('ul li, [role="radio"], [role="checkbox"], .answerBg'));
    }
    return opts.filter(el => el.offsetParent !== null);
  }

  // 严格检测单个选项是否已处于选中状态（区分大小写 Hover，避免误判小写 hover）
  function isOptionSelected(el) {
    if (!el) return false;
    if (el.getAttribute('aria-checked') === 'true') return true;
    if (el.querySelector('[aria-checked="true"]')) return true;
    const inp = el.querySelector('input[type="radio"], input[type="checkbox"]');
    if (inp && inp.checked) return true;
    const allCls = [el, ...Array.from(el.querySelectorAll('*'))].map(n => n.className || '').join(' ');
    return /\b(Hover|check_answer|check_answer_dx|current|checked)\b/.test(allCls);
  }

  // 检查整道题在 DOM 中是否已经真正选上/填上答案
  function isQuestionAnsweredInDOM(qEl) {
    const opts = getOptionElements(qEl);
    if (opts.length > 0) {
      return opts.some(opt => isOptionSelected(opt));
    }
    const textInputs = Array.from(qEl.querySelectorAll('textarea, input[type="text"]:not([readonly])'));
    if (textInputs.length > 0) {
      return textInputs.some(inp => (inp.value || '').trim().length > 0);
    }
    return true;
  }

  // 多重方式点击选项，确保真正触发学习通选中状态
  async function selectOptionElement(el) {
    if (!el) return;
    if (el.ownerDocument) stripAriaHidden(el.ownerDocument);
    if (isOptionSelected(el)) return;

    // 1. 优先点击选项圆圈或文字容器（含新版判断题 data="true"/"false" 节点）
    const innerTargets = el.querySelectorAll(
      'span.num_option, span.num_option_dx, [data="true"], [data="false"], .answer_p, a, label, i.fl'
    );
    for (const target of innerTargets) {
      if (!isOptionSelected(el)) {
        target.click();
        await sleep(100);
      }
    }

    // 2. 点击选项行本身
    if (!isOptionSelected(el)) {
      el.click();
      await sleep(100);
    }

    // 3. 兜底点击单选/复选 input
    if (!isOptionSelected(el)) {
      const inp = el.querySelector('input[type="radio"], input[type="checkbox"]');
      if (inp && !inp.checked) {
        inp.click();
        await sleep(100);
      }
    }

    // 4. 兜底派发鼠标点击事件
    if (!isOptionSelected(el)) {
      ['mousedown', 'mouseup', 'click'].forEach(evtType => {
        el.dispatchEvent(new MouseEvent(evtType, { bubbles: true, cancelable: true }));
      });
      await sleep(100);
    }
  }

  function detectQuestionType(qEl, qText, optItems) {
    let sectionTitle = '';
    let prev = qEl.previousElementSibling;
    while (prev) {
      if (prev.innerText && /(单选题|多选题|判断题|填空题)/.test(prev.innerText)) {
        sectionTitle = prev.innerText;
        break;
      }
      prev = prev.previousElementSibling;
    }

    if (
      qText.includes('多选') ||
      qEl.querySelectorAll('input[type="checkbox"], .num_option_dx, [role="checkbox"]').length > 0 ||
      (qEl.innerHTML && qEl.innerHTML.includes('addMultipleChoice')) ||
      (!qText.includes('单选') && !qText.includes('判断') && sectionTitle.includes('多选'))
    ) {
      return 'MULTI';
    }

    if (
      qText.includes('判断') ||
      qEl.querySelector('input[value="true"], input[value="false"], .ri, .wr') ||
      (optItems.length === 2 && (sectionTitle.includes('判断') || optItems.some(o => /(^|\s)(对|错|正确|错误)($|\s)/.test(o.innerText))))
    ) {
      return 'JUDGE';
    }

    return 'SINGLE';
  }

  // 1. 处理视频内随堂测验弹窗
  async function handleVideoPopupQuiz(wins) {
    for (const w of wins) {
      try {
        const quizBox = w.document.querySelector('.ans-videoquiz, .tkTopic');
        if (quizBox && quizBox.offsetParent !== null) {
          stripAriaHidden(w.document);
          const titleEl = quizBox.querySelector('.ans-videoquiz-title, .tkTopic_title');
          const optEls = Array.from(quizBox.querySelectorAll('.ans-videoquiz-opt, .tkTopic_ul li'));
          if (titleEl && optEls.length > 0) {
            const qText = titleEl.innerText.replace(/\s+/g, ' ').trim();
            const qType = qText.includes('多选') ? 'MULTI' : qText.includes('判断') ? 'JUDGE' : 'SINGLE';
            const oText = optEls.map(o => o.innerText.replace(/\s+/g, ' ').trim()).join('\n');
            const ans = (await askAI(qText, oText, qType))?.toUpperCase();
            if (ans) {
              for (let i = 0; i < optEls.length; i++) {
                const el = optEls[i];
                const txt = el.innerText.trim().toUpperCase();
                const letter = ['A', 'B', 'C', 'D', 'E', 'F'][i];
                const hit =
                  (qType !== 'JUDGE' && letter && ans.includes(letter)) ||
                  (qType === 'JUDGE' && ans.includes('对') && (i === 0 || txt.includes('对') || txt.includes('正确'))) ||
                  (qType === 'JUDGE' && ans.includes('错') && (i === 1 || txt.includes('错') || txt.includes('错误')));
                if (hit) {
                  const input = el.querySelector('input');
                  if (input && !input.checked) input.click();
                  else el.click();
                  await sleep(200);
                }
              }
              await sleep(600);
              const subBtn = quizBox.querySelector('.ans-videoquiz-submit, #videoquiz-submit, .tkTopic_btn');
              if (subBtn) subBtn.click();
            }
          }
        }
      } catch (e) {}
    }
  }

  // 2. 在答题页面查找“提交”按钮（兼容新版文本按钮与旧版类名）
  function findQuizSubmitButton(doc) {
    const bySelector = doc.querySelector(
      '.btnSubmit, .completeBtn, a[onclick*="btnBlueSubmit"], a[onclick*="submitWork"], .bot_btn a.jb_btn'
    );
    if (bySelector && bySelector.offsetParent !== null && !(bySelector.innerText || '').includes('暂时保存')) {
      return bySelector;
    }
    const candidates = Array.from(doc.querySelectorAll('a, button, span, div.jb_btn'));
    return candidates.find(el => {
      const t = (el.innerText || '').trim();
      return (t === '提交' || t === '提交作业') && el.offsetParent !== null && el.children.length === 0;
    });
  }

  // 3. 处理章节测验（返回值：true 表示当前正处于测验处理中，绝对禁止跳下一节；false 表示无未交测验）
  async function handleChapterQuiz(wins, runId) {
    for (const w of wins) {
      try {
        const allQuestions = Array.from(w.document.querySelectorAll('.TiMu, .questionLi')).filter(
          q => q.offsetParent !== null
        );
        if (allQuestions.length === 0) continue;

        // 如果页面上没有“提交”按钮，说明这份测验已经是提交完成后的只读查看状态
        const submitBtn = findQuizSubmitButton(w.document);
        if (!submitBtn) continue;

        stripAriaHidden(w.document);

        // 筛选出尚未在 DOM 中真正选上答案的题目（或多选题尚未经 AI 处理的题目）
        const pendingQuestions = allQuestions.filter(q => !isQuestionAnsweredInDOM(q) || !q.__aiDoneV7);

        if (pendingQuestions.length > 0) {
          logMsg(`📝 发现 ${pendingQuestions.length}/${allQuestions.length} 道待完成题目，开始作答...`);
          const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

          for (const qEl of pendingQuestions) {
            if (!AI_CONFIG.ENABLED || window.__chaoxingRunningId !== runId) return true;

            const titleEl = qEl.querySelector('.Zy_TItle .clearfix, .mark_name, .qtTitle, .Zy_TItle, h3');
            if (!titleEl) {
              logMsg('⚠️ 跳过 1 道未识别到题干 DOM 的题目');
              continue;
            }

            const qText = titleEl.innerText.replace(/\s+/g, ' ').trim();
            const optItems = getOptionElements(qEl);
            const textInputs = Array.from(qEl.querySelectorAll('textarea, input[type="text"]:not([readonly])'));

            if (optItems.length > 0) {
              const qType = detectQuestionType(qEl, qText, optItems);

              // 如果单选/判断题已经在页面上选好了，直接标记完成无需重复请求
              if (qType !== 'MULTI' && isQuestionAnsweredInDOM(qEl)) {
                qEl.__aiDoneV7 = true;
                continue;
              }

              const oText = optItems
                .map((el, idx) => {
                  const raw = el.innerText.replace(/\s+/g, ' ').trim();
                  return raw.startsWith(letters[idx]) ? raw : `${letters[idx]}. ${raw}`;
                })
                .join('\n');

              logMsg(`🔍 正在请求 AI (${qType}): ${qText.slice(0, 26)}...`);
              const rawAns = await askAI(qText, oText, qType);
              if (!AI_CONFIG.ENABLED || window.__chaoxingRunningId !== runId) return true;
              if (!rawAns) continue;

              const ans = rawAns.toUpperCase();

              if (qType === 'JUDGE') {
                const isTrue =
                  ans.includes('对') ||
                  ans.includes('正确') ||
                  ans.includes('TRUE') ||
                  ans.includes('√') ||
                  ans === 'T' ||
                  ans === 'YES' ||
                  (/^A(\b|[^A-Z])/.test(ans) && !ans.includes('错'));

                // 1. 优先按新版学习通 data="true"/"false" 属性匹配（完全不受字体加密影响）
                let targetOpt = optItems.find(o =>
                  isTrue
                    ? o.getAttribute('data') === 'true' || Boolean(o.querySelector('[data="true"]'))
                    : o.getAttribute('data') === 'false' || Boolean(o.querySelector('[data="false"]'))
                );
                // 2. 其次按选项里的“对/错”文字匹配
                if (!targetOpt) {
                  targetOpt = optItems.find(o =>
                    isTrue ? /(对|正确|√|true)/i.test(o.innerText) : /(错|错误|×|false)/i.test(o.innerText)
                  );
                }
                // 3. 兜底按 0/1 下标匹配
                if (!targetOpt) targetOpt = optItems[isTrue ? 0 : 1];

                if (targetOpt) await selectOptionElement(targetOpt);
              } else if (qType === 'SINGLE') {
                const firstLetter = ans.match(/[A-H]/)?.[0];
                const targetIdx = letters.indexOf(firstLetter);
                if (targetIdx !== -1 && optItems[targetIdx]) {
                  await selectOptionElement(optItems[targetIdx]);
                }
              } else {
                const chosenLetters = Array.from(new Set(ans.replace(/[^A-H]/g, '').split('')));
                for (const lt of chosenLetters) {
                  const idx = letters.indexOf(lt);
                  if (idx !== -1 && optItems[idx]) {
                    await selectOptionElement(optItems[idx]);
                    await sleep(250);
                  }
                }
              }

              if (isQuestionAnsweredInDOM(qEl)) {
                qEl.__aiDoneV7 = true;
              } else {
                logMsg(`⚠️ 题目勾选未生效 (${qType}): ${qText.slice(0, 22)}...`);
              }
            } else if (textInputs.length > 0) {
              logMsg(`🔍 正在请求 AI (FILL): ${qText.slice(0, 26)}...`);
              const ans = await askAI(qText, '', 'FILL');
              if (!AI_CONFIG.ENABLED || window.__chaoxingRunningId !== runId) return true;
              if (!ans) continue;
              const parts = ans.split('|').map(s => s.trim());
              textInputs.forEach((inp, idx) => {
                const val = parts[idx] || parts[0] || ans;
                inp.value = val;
                inp.dispatchEvent(new Event('input', { bubbles: true }));
                inp.dispatchEvent(new Event('change', { bubbles: true }));
                if (w.UE && w.UE.instants) {
                  Object.values(w.UE.instants).forEach(ue => {
                    if (ue && ue.textarea === inp) ue.setContent(val);
                  });
                }
              });
              qEl.__aiDoneV7 = true;
            } else {
              logMsg(`⚠️ 未识别到可作答选项/输入框: ${qText.slice(0, 24)}...`);
            }

            await sleep(1000);
          }
        }

        // 强制检查：是否所有题目在页面上都已经真正选上答案？
        const unAnsweredCount = allQuestions.filter(q => !isQuestionAnsweredInDOM(q)).length;
        if (unAnsweredCount > 0) {
          logMsg(`⏳ 还有 ${unAnsweredCount} 道题未完成勾选，下一轮巡检立即补答，暂不提交...`);
          return true; // 返回 true 阻止脚本点“下一节”
        }

        // 本节题目已全部勾选完毕，标记本节已完成一轮 AI 作答
        chapterAiDoneSet.add(getCurrentChapterKey(wins));

        // 所有题目均已勾选完毕，执行自动提交
        if (AI_CONFIG.AUTO_SUBMIT_WORK && submitBtn) {
          logMsg(`📤 全部 ${allQuestions.length} 道题目已校验勾选完毕，正在点击【提交】...`);
          submitBtn.click();
          if (submitBtn.parentElement && submitBtn.tagName === 'SPAN') {
            submitBtn.parentElement.click();
          }
          await sleep(1500);

          // 点击提交后的“确定 / 确认提交”弹窗
          for (const winItem of getAllWindows()) {
            try {
              const confirmBtns = Array.from(
                winItem.document.querySelectorAll('#submitConfirmPop .bluebtn, .confirm_btn, .bluebtn, .jb_btn, a, button, span')
              );
              const okBtn = confirmBtns.find(b => {
                const t = (b.innerText || '').trim();
                return (t === '确定' || t === '确认' || t === '确认提交') && b.offsetParent !== null && b.children.length === 0;
              });
              if (okBtn) {
                logMsg('✅ 已点击交卷确认弹窗【确定】');
                okBtn.click();
                if (okBtn.parentElement) okBtn.parentElement.click();
              }
            } catch (e) {}
          }
          await sleep(4000);
          return false; // 交卷完成，允许进入下一节
        }

        return true;
      } catch (e) {
        logMsg(`⚠️ 测验处理异常: ${e?.message || e}`);
      }
    }
    return false;
  }

  // 4. 检查当前章节顶部是否还有未切换的标签页（如播完“1 教学视频”后先切到同节的“2 章节测验”）
  function switchToNextTabInCurrentChapter(wins) {
    for (const w of wins) {
      try {
        const tabs = Array.from(w.document.querySelectorAll('.prev_ul li, .tabtags span'));
        if (tabs.length > 1) {
          const activeIdx = tabs.findIndex(t => /\b(active|cur|current)\b/i.test(t.className || ''));
          if (activeIdx !== -1 && activeIdx + 1 < tabs.length) {
            const nextTab = tabs[activeIdx + 1];
            if (!nextTab.__tabVisitedV7) {
              nextTab.__tabVisitedV7 = true;
              logMsg(`🔀 正在切换到本节下一个标签页: ${(nextTab.innerText || '').trim()}`);
              nextTab.click();
              const innerLink = nextTab.querySelector('a, span');
              if (innerLink) innerLink.click();
              return true;
            }
          }
        }
      } catch (e) {}
    }
    return false;
  }

  // 5. 点击“下一节”
  function clickNextChapter(wins) {
    // 如果页面上有“去学习”弹窗，优先点“去学习”而不是“下一节”
    if (handleUnfinishedTaskModal(wins)) return true;

    for (const w of wins) {
      try {
        const directNext = w.document.querySelector(
          '#prevNextFocusNext, .prev_next.next, .nextChapter, a[onclick*="PCount.next"]'
        );
        if (directNext && directNext.offsetParent !== null) {
          logMsg('⏭️ 本节全部完成，正在进入【下一节】...');
          directNext.click();
          return true;
        }
        const candidates = Array.from(w.document.querySelectorAll('a, button, span, div'));
        const nextBtn = candidates.find(el => {
          const txt = (el.innerText || '').trim();
          return (txt === '下一节' || txt === '下一页') && el.offsetParent !== null && el.children.length === 0;
        });
        if (nextBtn) {
          logMsg('⏭️ 本节全部完成，正在进入【下一节】...');
          nextBtn.click();
          if (nextBtn.parentElement) nextBtn.parentElement.click();
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  function isVideoFinished(v) {
    return v.ended || (v.duration > 0 && v.currentTime >= v.duration - 1.5);
  }

  // 采用单线程顺序循环（彻底杜绝 setInterval 并发抢跑点“下一节”的 Bug）
  async function mainLoop(runId) {
    while (window.__chaoxingRunningId === runId && AI_CONFIG.ENABLED) {
      const wins = getAllWindows();
      patchWindowEnvironment(wins);

      // 1. 若有“当前章节还有任务点未完成”弹窗，自动判断点【去学习】还是【继续下一节】
      if (handleUnfinishedTaskModal(wins)) {
        await sleep(2500);
        continue;
      }

      // 2. 检查视频内随堂测验
      await handleVideoPopupQuiz(wins);

      // 3. 检查当前页是否有未播完的视频
      const allVideos = [];
      for (const w of wins) {
        try {
          w.document.querySelectorAll('video').forEach(v => allVideos.push({ video: v, win: w }));
        } catch (e) {}
      }

      const activeItem = allVideos.find(item => !isVideoFinished(item.video));

      if (activeItem) {
        const { video: videoEl, win: videoWin } = activeItem;

        if (!videoEl.__pauseLocked) {
          videoEl.addEventListener('pause', () => {
            if (!isVideoFinished(videoEl) && AI_CONFIG.ENABLED) {
              setTimeout(() => {
                videoEl.muted = true;
                videoEl.play().catch(() => {});
              }, 300);
            }
          });
          videoEl.__pauseLocked = true;
        }

        if (videoEl.paused) {
          videoEl.muted = true;
          videoEl.playbackRate = 1.0;
          const playBtn = videoWin.document.querySelector('.vjs-big-play-button, .vjs-play-control');
          if (playBtn && videoEl.currentTime === 0) playBtn.click();
          videoEl.play().catch(() => {});
        }
      } else {
        // 4. 视频已播完（或当前在测验标签页），先处理章节测验
        const stillWorkingOnQuiz = await handleChapterQuiz(wins, runId);
        if (!stillWorkingOnQuiz && AI_CONFIG.ENABLED && window.__chaoxingRunningId === runId) {
          // 5. 如果本节顶部还有“2 章节测验”标签页没点开，先切过去；否则等待 3 秒确认无新任务后再点下一节
          if (switchToNextTabInCurrentChapter(wins)) {
            await sleep(4000);
            continue;
          }
          await sleep(3000);
          // 再次确认没有新加载出来的测验后，才点击下一节
          const doubleCheckQuiz = await handleChapterQuiz(getAllWindows(), runId);
          if (!doubleCheckQuiz && AI_CONFIG.ENABLED && window.__chaoxingRunningId === runId) {
            if (clickNextChapter(getAllWindows())) {
              await sleep(1200);
              // 点击“下一节”后若立刻弹出“当前章节还有任务点未完成”，立即处理（AI 已答完则直接点【继续下一节】）
              handleUnfinishedTaskModal(getAllWindows());
              await sleep(3800);
            } else {
              await sleep(3000);
            }
          }
        }
      }

      await sleep(3000);
    }
  }

  mountStatusPanel();
  if (AI_CONFIG.ENABLED) {
    logMsg('🚀 V7 顺序防抢跑版已启动（自动点“去学习”/“继续下一节”+ 强制校验每题勾选 + 自动交卷）！');
    startNewMainLoop();
  } else {
    logMsg('⏸️ V7 插件已就绪（当前处于暂停状态，可点击面板开启）');
  }
})();
