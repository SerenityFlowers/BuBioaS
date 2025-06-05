// results.js
// =============================================================
// 1) 并行加载五个 JSON 分片
// 2) 支持九字段组合检索（正则）+ 仅显示匹配的釋義键值对
// 3) 去重后完整展示：聲首 / 諧聲域 / 上古聲 / 上古韻
//                        上古音（參考）/ 中古地位 / 切語 / 切拼 / 字頭
// =============================================================

/* ---------- 文件路径与核心 DOM ---------- */
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

/* ---------- 返回按钮 ---------- */
backBtn.onclick = () => (location.href = 'index.html');

/* ---------- 全局状态 ---------- */
let all         = [];
let loadedCount = 0;

/* ---------- 并行加载所有 JSON 分片 ---------- */
jsonFiles.forEach(path => {
  fetch(path)
    .then(r => {
      if (!r.ok) throw new Error(`无法加载：${path}`);
      return r.json();
    })
    .then(arr => {
      all = all.concat(arr);
      loadedCount++;
      progFill.style.width = `${Math.round(
        (loadedCount / jsonFiles.length) * 100
      )}%`;

      if (loadedCount === jsonFiles.length) {
        setTimeout(() => {
          progWrap.style.display = 'none';
          renderResults();
        }, 200);
      }
    })
    .catch(err => {
      resultsEl.innerHTML = `<p class="error">${err.message}</p>`;
    });
});

/* ---------- 解析查询参数 ---------- */
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

/* ---------- 主渲染函数 ---------- */
function renderResults() {
  const q = getQuery();

  // 如果所有搜索字段都为空，则提示并返回
  if (Object.values(q).every(v => !v)) {
    resultsEl.innerHTML = '<p>未提供任何查询条件。</p>';
    return;
  }

  // 逐条匹配并计算 matchedShiYi
  const matched = all.filter(e => {
    const ok = (key, pattern) => !pattern || new RegExp(pattern).test(e[key] || '');

    if (
      !ok('字頭', q.字頭) ||
      !ok('聲首', q.聲首) ||
      !ok('諧聲域', q.諧聲域) ||
      !ok('上古聲', q.上古聲) ||
      !ok('上古韻', q.上古韻) ||
      !ok('上古音（參考）', q['上古音（參考）']) ||
      !ok('中古地位', q.中古地位) ||
      !ok('切語', q.切語) ||
      !ok('切拼', q.切拼)
    ) {
      return false;
    }

    // 计算 matchedShiYi：
    if (q.釋義) {
      const re = new RegExp(q.釋義);
      e.matchedShiYi = Object.fromEntries(
        Object.entries(e.釋義 || {}).filter(([k]) => re.test(k))
      );
      return Object.keys(e.matchedShiYi).length > 0;
    } else {
      // 未填写釋義条件，则全部保留
      e.matchedShiYi = { ...(e.釋義 || {}) };
      return true;
    }
  });

  if (!matched.length) {
    resultsEl.innerHTML = '<p>没有找到符合条件的条目。</p>';
    return;
  }

  // 按“字頭”分组并去重（用 matchedShiYi 来去重）
  const groups = new Map(); // Map<字頭, Map<signature, entry>>
  matched.forEach(e => {
    const sig = JSON.stringify([
      e.聲首,
      e.諧聲域,
      e.上古聲,
      e.上古韻,
      e['上古音（參考）'],
      e.中古地位,
      e.切語,
      e.切拼,
      e.matchedShiYi
    ]);

    if (!groups.has(e.字頭)) {
      groups.set(e.字頭, new Map());
    }
    groups.get(e.字頭).set(sig, e);
  });

  // 生成卡片并插入页面
  resultsEl.innerHTML = '';
  [...groups.keys()]
    .sort((a, b) => a.localeCompare(b, 'zh-Hant'))
    .forEach(z => {
      // 去重后第一条作为代表
      const rep = [...groups.get(z).values()][0];

      const card = document.createElement('div');
      card.className = 'char-card';

      // 1. 字頭标题
      const titleDiv = document.createElement('div');
      titleDiv.className = 'card-title';
      titleDiv.textContent = z;
      card.appendChild(titleDiv);

      // 2. 九字段信息
      const info = document.createElement('div');
      info.className = 'card-info';
      const v = key => rep[key] || '—';
      info.innerHTML = `
        <p><strong>聲首：</strong><span>${v('聲首')}</span></p>
        <p><strong>諧聲域：</strong><span>${v('諧聲域')}</span></p>
        <p><strong>上古聲：</strong><span>${v('上古聲')}</span></p>
        <p><strong>上古韻：</strong><span>${v('上古韻')}</span></p>
        <p><strong>上古音（參考）：</strong><span>${v('上古音（參考）')}</span></p>
        <p><strong>中古地位：</strong><span>${v('中古地位')}</span></p>
        <p><strong>切語：</strong><span>${v('切語')}</span></p>
        <p><strong>切拼：</strong><span>${v('切拼')}</span></p>
      `;
      card.appendChild(info);

      // 3. 釋義（只展示 matchedShiYi）
      const shi = document.createElement('div');
      shi.className = 'card-shiyi';
      shi.innerHTML = '<p><strong>釋義：</strong></p>';
      const ul = document.createElement('ul');
      Object.entries(rep.matchedShiYi).forEach(([k, v]) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="shiyi-key">「${k}」</span> → <span class="shiyi-val">${v}</span>`;
        ul.appendChild(li);
      });
      shi.appendChild(ul);
      card.appendChild(shi);

      resultsEl.appendChild(card);
    });
}
