let data = [];

// Fetch data from JSON file and set up search functionality after data is loaded
fetch('data.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        document.querySelector('button').addEventListener('click', filterEntries);
    })
    .catch(error => console.error('Error loading JSON data:', error));

    function filterEntries() {
        if (data.length === 0) {
            alert("数据尚未加载，请稍后再试");
            return;
        }
    
        const soundSymbolKeyword = document.getElementById('soundSymbolSearch').value.toLowerCase();
        const soundDomainKeyword = document.getElementById('soundDomainSearch').value.toLowerCase();
        const ancientSoundKeyword = document.getElementById('ancientSoundSearch').value.toLowerCase();
        const ancientRhymeKeyword = document.getElementById('ancientRhymeSearch').value.toLowerCase();
        const ancientPronunciationKeyword = document.getElementById('ancientPronunciationSearch').value.toLowerCase();
        const medievalPronunciationKeyword = document.getElementById('medievalPronunciationSearch').value.toLowerCase();
        const spellKeyword = document.getElementById('spellSearch').value.toLowerCase();
        const characterKeyword = document.getElementById('characterSearch').value.toLowerCase();
        const definitionKeyword = document.getElementById('definitionSearch').value.toLowerCase();
    
        // 篩選符合條件的條目
        let filteredEntries = data.filter(entry => {
            const matchesDefinition = definitionKeyword
                ? entry.釋義 && entry.釋義.toLowerCase().includes(definitionKeyword)
                : true;
    
            return (!soundSymbolKeyword || entry.聲符.toLowerCase().includes(soundSymbolKeyword)) &&
                   (!soundDomainKeyword || entry.聲域.toLowerCase().includes(soundDomainKeyword)) &&
                   (!ancientSoundKeyword || entry.上古聲.toLowerCase().includes(ancientSoundKeyword)) &&
                   (!ancientRhymeKeyword || entry.上古韻.toLowerCase().includes(ancientRhymeKeyword)) &&
                   (!ancientPronunciationKeyword || entry.上古音.toLowerCase().includes(ancientPronunciationKeyword)) &&
                   (!medievalPronunciationKeyword || entry.中古音.toLowerCase().includes(medievalPronunciationKeyword)) &&
                   (!spellKeyword || entry.切拼.toLowerCase().includes(spellKeyword)) &&
                   (!characterKeyword || entry.字.toLowerCase().includes(characterKeyword)) &&
                   matchesDefinition;
        });
    
        // 使用 Map 去重
        const uniqueEntriesMap = new Map();
        filteredEntries.forEach(entry => {
            if (!uniqueEntriesMap.has(entry.字)) {
                // 僅提取包含定義關鍵字的行
                if (definitionKeyword && entry.釋義) {
                    const filteredDefinition = entry.釋義.split('\n')
                        .filter(line => line.toLowerCase().includes(definitionKeyword))
                        .join('<br>');
                    uniqueEntriesMap.set(entry.字, { ...entry, filteredDefinition });
                } else {
                    uniqueEntriesMap.set(entry.字, entry);
                }
            }
        });
    
        // 將 Map 中的唯一值轉為數組
        filteredEntries = Array.from(uniqueEntriesMap.values());
    
        // 将去重且过滤后的结果保存到 localStorage，并导航到结果页面
localStorage.setItem('filteredEntries', JSON.stringify(filteredEntries));
window.open('results.html', 'resultsTab');

    }
        