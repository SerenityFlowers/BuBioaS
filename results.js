function displayEntries(entries) {
    const container = document.getElementById('entriesContainer');
    container.innerHTML = ''; // 清空当前内容
    
    entries.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.classList.add('entry');
        
        const definitionContent = entry.filteredDefinition ? entry.filteredDefinition : entry.釋義;
        
        entryDiv.innerHTML = `
            <p><strong>字頭：</strong> ${entry.字}</p>
            <p><strong>聲符：</strong> ${entry.聲符}</p>
            <p><strong>諧聲域：</strong> ${entry.聲域}</p>
            <p><strong>上古声：</strong> ${entry.上古聲}</p>
            <p><strong>上古韵：</strong> ${entry.上古韻}</p>
            <p><strong>上古音節：</strong> ${entry.上古音}</p>
            <p><strong>切韻地位：</strong> ${entry.中古音}</p>
            <p><strong>切韻拼音：</strong> ${entry.切拼}</p>
            <div class="definition-content" style="display: block;">
                <p><strong>釋義：</strong> ${definitionContent}</p>
            </div>
        `;
        container.appendChild(entryDiv);
    });
}

// 从 localStorage 获取搜索结果并显示
const entries = JSON.parse(localStorage.getItem('filteredEntries'));
if (entries && entries.length > 0) {
    displayEntries(entries);
} else {
    document.getElementById('entriesContainer').innerHTML = '<p>未找到相關結果</p>';
}
