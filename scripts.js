let data = [];

// 异步加载三个JSON文件并合并
async function loadData() {
    try {
        const response1 = await fetch('data_part1.json');
        const jsonData1 = await response1.json();
        const response2 = await fetch('data_part2.json');
        const jsonData2 = await response2.json();
        const response3 = await fetch('data_part3.json');
        const jsonData3 = await response3.json();

        // 合并数据
        data = [...jsonData1, ...jsonData2, ...jsonData3];
        document.querySelector('button').addEventListener('click', filterEntries);
    } catch (error) {
        console.error('Error loading JSON data:', error);
    }
}

// 调用loadData函数开始加载数据
loadData();

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
        // 创建一个正则表达式，确保用户输入可以被转义并且不区分大小写
        const createRegExp = (keyword) => {
            try {
                return new RegExp(keyword, 'i'); // 'i' 是不区分大小写的标志
            } catch (e) {
                console.error('Invalid regular expression:', keyword);
                return null;
            }
        };
    
        // 将关键字转化为正则表达式
        const definitionRegExp = definitionKeyword ? createRegExp(definitionKeyword) : null;
        const soundSymbolRegExp = soundSymbolKeyword ? createRegExp(soundSymbolKeyword) : null;
        const soundDomainRegExp = soundDomainKeyword ? createRegExp(soundDomainKeyword) : null;
        const ancientSoundRegExp = ancientSoundKeyword ? createRegExp(ancientSoundKeyword) : null;
        const ancientRhymeRegExp = ancientRhymeKeyword ? createRegExp(ancientRhymeKeyword) : null;
        const ancientPronunciationRegExp = ancientPronunciationKeyword ? createRegExp(ancientPronunciationKeyword) : null;
        const medievalPronunciationRegExp = medievalPronunciationKeyword ? createRegExp(medievalPronunciationKeyword) : null;
        const spellRegExp = spellKeyword ? createRegExp(spellKeyword) : null;
        const characterRegExp = characterKeyword ? createRegExp(characterKeyword) : null;
    
        // 过滤条目，使用正则表达式进行匹配
        return (!soundSymbolKeyword || (soundSymbolRegExp && soundSymbolRegExp.test(entry.聲符))) &&
               (!soundDomainKeyword || (soundDomainRegExp && soundDomainRegExp.test(entry.聲域))) &&
               (!ancientSoundKeyword || (ancientSoundRegExp && ancientSoundRegExp.test(entry.上古聲))) &&
               (!ancientRhymeKeyword || (ancientRhymeRegExp && ancientRhymeRegExp.test(entry.上古韻))) &&
               (!ancientPronunciationKeyword || (ancientPronunciationRegExp && ancientPronunciationRegExp.test(entry.上古音))) &&
               (!medievalPronunciationKeyword || (medievalPronunciationRegExp && medievalPronunciationRegExp.test(entry.中古音))) &&
               (!spellKeyword || (spellRegExp && spellRegExp.test(entry.切拼))) &&
               (!characterKeyword || (characterRegExp && characterRegExp.test(entry.字))) &&
               (!definitionKeyword || (definitionRegExp && definitionRegExp.test(entry.釋義)));
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
