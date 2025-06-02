// 頁面加載完成後立即開始加載數據
document.addEventListener('DOMContentLoaded', async function() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const searchButton = document.getElementById('search-button');

    // 確保進度條元素存在
    if (!progressBar || !progressText || !searchButton) {
        document.querySelector('.container').innerHTML = '<p>頁面錯誤：無法找到進度條或按鈕元素，請檢查 HTML 結構</p>';
        console.error('進度條或按鈕元素缺失');
        return;
    }

    // 定義數據文件列表
    const dataFiles = [
        'data/dictionary-part1.json',
        'data/dictionary-part2.json',
        'data/dictionary-part3.json',
        'data/dictionary-part4.json',
        'data/dictionary-part5.json'
    ];

    // 加載數據並更新進度條
    let loadedFiles = 0;
    const totalFiles = dataFiles.length;

    try {
        const promises = dataFiles.map(async (file, index) => {
            try {
                const response = await fetch(file);
                if (!response.ok) {
                    throw new Error(`無法加載文件 ${file}: ${response.status} ${response.statusText}`);
                }
                await response.json(); // 僅加載數據以更新進度條，不存儲
                loadedFiles += 1;
                const progress = Math.round((loadedFiles / totalFiles) * 100);
                progressBar.style.setProperty('--progress-width', `${progress}%`);
                progressText.textContent = `正在加載... ${progress}%`;
            } catch (error) {
                throw new Error(`加載 ${file} 失敗: ${error.message}`);
            }
        });

        // 並行加載所有文件
        await Promise.all(promises);
    } catch (error) {
        progressText.textContent = '加載數據失敗，請檢查數據文件';
        console.error('數據加載錯誤:', error);
        return;
    }

    // 加載完成，隱藏進度條長條，僅顯示文字並啟用查詢按鈕
    progressBar.style.display = 'none'; // 隱藏進度條長條
    progressText.textContent = '數據加載完成，請進行搜索';
    searchButton.disabled = false;
});

// 處理表單提交事件
document.getElementById('search-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const queryParams = new URLSearchParams();

    // 遍歷表單數據，將非空輸入添加到查詢參數
    formData.forEach((value, key) => {
        if (value.trim()) {
            // 對正則表達式進行 URL 編碼以避免問題
            queryParams.append(key, encodeURIComponent(value));
        }
    });

    // 將查詢參數存入 sessionStorage
    sessionStorage.setItem('searchQuery', queryParams.toString());

    // 重定向到結果頁面
    window.location.href = 'results.html';
});