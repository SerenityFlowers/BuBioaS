// 頁面加載完成後執行
document.addEventListener('DOMContentLoaded', async function() {
    const resultsDiv = document.getElementById('results');

    // 定義數據文件列表
    const dataFiles = [
        'data/dictionary-part1.json',
        'data/dictionary-part2.json',
        'data/dictionary-part3.json',
        'data/dictionary-part4.json',
        'data/dictionary-part5.json'
    ];

    // 加載數據
    let dictionaryData = [];
    try {
        const promises = dataFiles.map(async (file, index) => {
            try {
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`無法加載文件 ${file}: ${response.status} ${response.statusText}`);
                }
                return await response.json();
            } catch (error) {
                throw new Error(`加載 ${file} 失敗: ${error.message}`);
            }
        });

        // 並行加載所有文件
        const allParts = await Promise.all(promises);

        // 合併數據
        dictionaryData = allParts.flat();
    } catch (error) {
        resultsDiv.innerHTML = `<p>錯誤: ${error.message}</p>`;
        console.error('數據加載錯誤:', error);
        return;
    }

    // 從 sessionStorage 獲取查詢參數
    const queryString = sessionStorage.getItem('searchQuery') || '';
    if (!queryString) {
        resultsDiv.innerHTML = '<p>未找到查詢條件，請返回主頁重新查詢</p>';
        return;
    }

    const params = new URLSearchParams(queryString);
    const queries = {
        聲首: params.get('聲首') ? decodeURIComponent(params.get('聲首')) : '',
        諧聲域: params.get('諧聲域') ? decodeURIComponent(params.get('諧聲域')) : '',
        上古聲: params.get('上古聲') ? decodeURIComponent(params.get('上古聲')) : '',
        上古韻: params.get('上古韻') ? decodeURIComponent(params.get('上古韻')) : '',
        '上古音（參考）': params.get('上古音（參考）') ? decodeURIComponent(params.get('上古音（參考）')) : '',
        中古地位: params.get('中古地位') ? decodeURIComponent(params.get('中古地位')) : '',
        切語: params.get('切語') ? decodeURIComponent(params.get('切語')) : '',
        切拼: params.get('切拼') ? decodeURIComponent(params.get('切拼')) : '',
        字頭: params.get('字頭') ? decodeURIComponent(params.get('字頭')) : '',
        釋義: params.get('釋義') ? decodeURIComponent(params.get('釋義')) : ''
    };

    // 按字頭分組並合併釋義
    const groupedResults = new Map();
    
    dictionaryData.forEach(entry => {
        let matches = true;
        let matchedShiYi = {};

        try {
            // 檢查聲首
            if (queries.聲首) {
                const regex = new RegExp(queries.聲首);
                matches = matches && regex.test(entry.聲首);
            }
            // 檢查諧聲域
            if (queries.諧聲域) {
                const regex = new RegExp(queries.諧聲域);
                matches = matches && regex.test(entry.諧聲域);
            }
            // 檢查上古聲
            if (queries.上古聲) {
                const regex = new RegExp(queries.上古聲);
                matches = matches && regex.test(entry.上古聲);
            }
            // 檢查上古韻
            if (queries.上古韻) {
                const regex = new RegExp(queries.上古韻);
                matches = matches && regex.test(entry.上古韻);
            }
            // 檢查上古音（參考）
            if (queries['上古音（參考）']) {
                const regex = new RegExp(queries['上古音（參考）']);
                matches = matches && regex.test(entry['上古音（參考）']);
            }
            // 檢查中古地位
            if (queries.中古地位) {
                const regex = new RegExp(queries.中古地位);
                matches = matches && regex.test(entry.中古地位);
            }
            // 檢查切語
            if (queries.切語) {
                const regex = new RegExp(queries.切語);
                matches = matches && regex.test(entry.切語);
            }
            // 檢查切拼
            if (queries.切拼) {
                const regex = new RegExp(queries.切拼);
                matches = matches && regex.test(entry.切拼);
            }
            // 檢查字頭
            if (queries.字頭) {
                const regex = new RegExp(queries.字頭);
                matches = matches && regex.test(entry.字頭);
            }
            // 檢查釋義（匹配所有符合的鍵）
            if (queries.釋義) {
                const regex = new RegExp(queries.釋義);
                const shiYiKeys = Object.keys(entry.釋義);
                shiYiKeys.forEach(key => {
                    if (regex.test(key)) {
                        matchedShiYi[key] = entry.釋義[key];
                    }
                });
                // 如果沒有匹配的釋義，則不匹配
                if (Object.keys(matchedShiYi).length === 0) {
                    matches = false;
                }
            } else {
                matchedShiYi = entry.釋義; // 如果沒有釋義查詢，保留所有釋義
            }
        } catch (e) {
            console.error('無效正則表達式:', e);
            matches = false;
        }

        // 如果匹配成功，按字頭分組並合併釋義
        if (matches) {
            const ziTou = entry.字頭;
            if (groupedResults.has(ziTou)) {
                // 合併釋義
                const existingEntry = groupedResults.get(ziTou);
                existingEntry.釋義 = { ...existingEntry.釋義, ...matchedShiYi };
            } else {
                // 新增條目
                groupedResults.set(ziTou, {
                    ...entry,
                    釋義: matchedShiYi
                });
            }
        }
    });

    // 轉為數組
    const results = Array.from(groupedResults.values());

    // 渲染結果
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>無符合條件的結果</p>';
        return;
    }

    results.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'card';

        // 構建卡片內容
        card.innerHTML = `
            <h2>${entry.字頭}</h2>
            <div class="field-group">
                <p><strong>聲首:</strong> ${entry.聲首}</p>
                <p><strong>諧聲域:</strong> ${entry.諧聲域}</p>
                <p><strong>上古聲:</strong> ${entry.上古聲}</p>
                <p><strong>上古韻:</strong> ${entry.上古韻}</p>
                <p><strong>上古音（參考）:</strong> ${entry['上古音（參考）']}</p>
                <p><strong>中古地位:</strong> ${entry.中古地位}</p>
                <p><strong>切語:</strong> ${entry.切語}</p>
                <p><strong>切拼:</strong> ${entry.切拼}</p>
            </div>
            <div class="shiyi-group">
                <p><strong>釋義:</strong></p>
                <ul>
                    ${Object.keys(entry.釋義).map(key => `
                        <li>${key} <span class="source-info">(${entry.釋義[key]})</span></li>
                    `).join('')}
                </ul>
                <span class="toggle-source" style="${Object.keys(entry.釋義).length === 0 ? 'display: none;' : ''}">顯示來源</span>
            </div>
        `;

        // 添加來源顯示/隱藏切換功能
        const toggleButton = card.querySelector('.toggle-source');
        const sources = card.querySelectorAll('.source-info');

        // 僅在有來源信息時綁定事件監聽器
        if (sources.length > 0 && toggleButton) {
            toggleButton.addEventListener('click', () => {
                sources.forEach(source => {
                    source.classList.toggle('show');
                });
                toggleButton.textContent = sources[0].classList.contains('show') ? '隱藏來源' : '顯示來源';
            });
        }
        resultsDiv.appendChild(card);
    });
});