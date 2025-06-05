// search.js
// -------------------------------------------------------------
// 采集九字段检索条件 -> 存到 sessionStorage -> 跳转 results.html
// -------------------------------------------------------------
const form   = document.getElementById('searchForm');
const button = document.getElementById('searchButton');

// 提交表单
form.addEventListener('submit', e => {
  e.preventDefault();

  const data   = new FormData(form);
  const params = new URLSearchParams();

  // 仅把“非空”字段写入
  data.forEach((val, key) => {
    const v = val.trim();
    if (v) params.append(key, v);
  });

  // 存入 sessionStorage
  sessionStorage.setItem('searchQuery', params.toString());

  // 跳转到结果页
  location.href = 'results.html';
});
