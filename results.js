// results.js
// =============================================================
// 1) 五個 JSON 並行載入；即讀即篩選＋去重＋分組，降低記憶體
// 2) 依九字段（含釋義）正則檢索；保留原來的“未填條件”提示
// 3) 同字頭下多讀音橫向分欄並排，滑塊滾動
// 4) 讀音區塊置於釋義之前
// =============================================================

/* ---------- 檔案路徑與核心 DOM ---------- */
const jsonFiles = [
  'dictionary-part1.json',
  'dictionary-part2.json',
  'dictionary-part3.json',
  'dictionary-part4.json',
  'dictionary-part5.json'
];

const backBtn   = document.getElementById('backButton');
const progWrap  = document.getElementById('progressContainer');
const progFill  = document.getElementById('progressFill');
const resultsEl = document.getElementById('results');

/* ---------- 返回按鈕 ---------- */
backBtn.onclick = () => (location.href = 'index.html');

/* ---------- 解析搜尋條件 ---------- */
function safeDecode(s) {
  let str = s;
  while (/%25/.test(str)) str = decodeURIComponent(str);
  return decodeURIComponent(str);
}
function getQuery() {
  const raw = sessionStorage.getItem('searchQuery') || '';
  const p   = new URLSearchParams(raw);
  const pick = k => (p.get(k) ? safeDecode(p.get(k)) : '');
  return {
    字頭:           pick('字頭'),
    聲首:           pick('聲首'),
    諧聲域:         pick('諧聲域'),
    上古聲:         pick('上古聲'),
    上古韻:         pick('上古韻'),
    '上古音（參考）': pick('上古音（參考）'),
    中古地位:       pick('中古地位'),
    切語:           pick('切語'),
    切拼:           pick('切拼'),
    釋義:           pick('釋義')
  };
}
const query = getQuery();

/* ---------- 若無條件，保持原行為 ---------- */
const noCondition = Object.values(query).every(v => !v);
if (noCondition) {
  resultsEl.innerHTML = '<p>未提供任何查询条件。</p>';
}

/* ---------- 即時注入讀音樣式（一次） ---------- */
(function injectStyle() {
  const id = 'reading-flex-style';
  if (document.getElementById(id)) return;
  const st = document.createElement('style');
  st.id = id;
  st.textContent = `
    .readings-wrapper {
      display: flex;
      gap: 1rem;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding: 0.5rem 0;
    }
    .reading-block {
      min-width: 220px;
      flex: 0 0 auto;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 0.5rem;
      background: #fafafa;
      box-sizing: border-box;
    }
    .reading-head { margin:0 0 .25rem 0;font-size:1rem;font-weight:600; }
    .card-shiyi  { margin-top:.75rem; }
  `;
  document.head.appendChild(st);
})();

/* ---------- 分組容器：Map<字頭, Map<signature, entryObj>> ---------- */
const groups = new Map();

/* ---------- 工具：欄位匹配 ---------- */
const ok = (src, pattern) => !pattern || new RegExp(pattern).test(src || '');

/* ---------- 處理單筆、直接寫入 groups ---------- */
function handleEntry(e) {
  // 1) 基本欄位條件
  if (
    !ok(e.字頭, query.字頭) ||
    !ok(e.聲首, query.聲首) ||
    !ok(e.諧聲域, query.諧聲域) ||
    !ok(e.上古聲, query.上古聲) ||
    !ok(e.上古韻, query.上古韻) ||
    !ok(e['上古音（參考）'], query['上古音（參考）']) ||
    !ok(e.中古地位, query.中古地位) ||
    !ok(e.切語, query.切語) ||
    !ok(e.切拼, query.切拼)
  ) return;

  // 2) 釋義條件 (若有)
  let matchedShiYi = {};
  if (query.釋義) {
    const re = new RegExp(query.釋義);
    matchedShiYi = Object.fromEntries(
      Object.entries(e.釋義 || {}).filter(([k]) => re.test(k))
    );
    if (!Object.keys(matchedShiYi).length) return; // 無匹配
  } else {
    matchedShiYi = { ...(e.釋義 || {}) };
  }

  // 3) 構建精簡 entry
  const entry = {
    聲首: e.聲首 || '',
    諧聲域: e.諧聲域 || '',
    上古聲: e.上古聲 || '',
    上古韻: e.上古韻 || '',
    '上古音（參考）': e['上古音（參考）'] || '',
    中古地位: e.中古地位 || '',
    切語: e.切語 || '',
    切拼: e.切拼 || '',
    釋義: matchedShiYi
  };

  // 4) 寫入 groups
  const sig = JSON.stringify([
    entry.聲首,
    entry.諧聲域,
    entry.上古聲,
    entry.上古韻,
    entry['上古音（參考）'],
    entry.中古地位,
    entry.切語,
    entry.切拼
  ]);

  if (!groups.has(e.字頭)) groups.set(e.字頭, new Map());
  const bucket = groups.get(e.字頭);

  if (bucket.has(sig)) {
    // 已存在 → 合併釋義（去重）
    Object.assign(bucket.get(sig).釋義, entry.釋義);
  } else {
    bucket.set(sig, entry);
  }
}

/* ---------- 並行載入，邊讀邊處理 ---------- */
let loadedCnt = 0;
jsonFiles.forEach(path =>
  fetch(path)
    .then(r => {
      if (!r.ok) throw new Error(`无法加载：${path}`);
      return r.json();
    })
    .then(arr => {
      if (!noCondition) {
        for (const e of arr) handleEntry(e);
      }
      loadedCnt++;
      progFill.style.width = `${Math.round(
        (loadedCnt / jsonFiles.length) * 100
      )}%`;
      if (loadedCnt === jsonFiles.length) {
        setTimeout(() => {
          progWrap.style.display = 'none';
          if (!noCondition) renderResults();
        }, 200);
      }
    })
    .catch(err => {
      resultsEl.innerHTML = `<p class="error">${err.message}</p>`;
    })
);

/* ---------- 渲染結果 ---------- */
function renderResults() {
  if (groups.size === 0) {
    resultsEl.innerHTML = '<p>没有找到符合条件的条目。</p>';
    return;
  }

  resultsEl.innerHTML = '';
  [...groups.keys()]
    .sort((a, b) => a.localeCompare(b, 'zh-Hant'))
    .forEach(z => {
      const bucket = groups.get(z);
      const entries = [...bucket.values()];

      /* ---- 外層卡片 ---- */
      const card = document.createElement('div');
      card.className = 'char-card';

      /* 標題 */
      const title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = z;
      card.appendChild(title);

      /* 讀音區塊（橫向） */
      const rw = document.createElement('div');
      rw.className = 'readings-wrapper';

      entries
        .sort((a, b) => {
          const sa = (a.切拼 || '') + (a.中古地位 || '');
          const sb = (b.切拼 || '') + (b.中古地位 || '');
          return sa.localeCompare(sb, 'zh-Hant');
        })
        .forEach((e, i) => {
          const blk = document.createElement('div');
          blk.className = 'reading-block';

          const h = document.createElement('h4');
          h.className = 'reading-head';
          h.textContent = `讀音 #${i + 1}`;
          blk.appendChild(h);

          const v = k => e[k] || '—';
          blk.innerHTML += `
            <p><strong>聲首：</strong><span>${v('聲首')}</span></p>
            <p><strong>諧聲域：</strong><span>${v('諧聲域')}</span></p>
            <p><strong>上古聲：</strong><span>${v('上古聲')}</span></p>
            <p><strong>上古韻：</strong><span>${v('上古韻')}</span></p>
            <p><strong>上古音（參考）：</strong><span>${v('上古音（參考）')}</span></p>
            <p><strong>中古地位：</strong><span>${v('中古地位')}</span></p>
            <p><strong>切語：</strong><span>${v('切語')}</span></p>
            <p><strong>切拼：</strong><span>${v('切拼')}</span></p>
          `;
          rw.appendChild(blk);
        });
      card.appendChild(rw);

      /* 釋義（合併去重） */
      const allShiYi = {};
      entries.forEach(e => Object.assign(allShiYi, e.釋義));

      const sw = document.createElement('div');
      sw.className = 'card-shiyi';
      sw.innerHTML = '<p><strong>釋義：</strong></p>';
      const ul = document.createElement('ul');
      Object.entries(allShiYi).forEach(([k, v]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="shiyi-key">「${k}」</span> → <span class="shiyi-val">${v}</span>`;
        ul.appendChild(li);
      });
      sw.appendChild(ul);
      card.appendChild(sw);

      resultsEl.appendChild(card);
    });
}
