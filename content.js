document.addEventListener('dblclick', function(event) {
  const target = event.target;
  if (target && target.classList.contains('ytp-caption-segment')) {
    const text = target.innerText;
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    const offset = range.startOffset;
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const textContent = textNode.textContent;

      let wordStart = offset;
      let wordEnd = offset;

      // 向前找到单词的开始
      while (wordStart > 0 && /\S/.test(textContent[wordStart - 1])) {
        wordStart--;
      }

      // 向后找到单词的结束
      while (wordEnd < textContent.length && /\S/.test(textContent[wordEnd])) {
        wordEnd++;
      }

      const word = textContent.substring(wordStart, wordEnd).trim();

      if (word && !word.includes(' ')) { // 检查是否是单词
        translateWord(word, event.clientX, event.clientY);
      }
    }
  }
});

function translateWord(word, x, y) {
  const apiUrl = `https://api.mymemory.translated.net/get?q=${word}&langpair=en|zh-CN`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.responseData && data.responseData.translatedText) {
        const translation = data.responseData.translatedText;
        showTooltip(word, translation, x, y);
      }
    })
    .catch(error => {
      console.error('翻译失败:', error);
    });
}

function showTooltip(word, translation, x, y) {
  const tooltip = document.createElement('div');
  tooltip.className = 'translation-tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.backgroundColor = 'white';
  tooltip.style.border = '1px solid black';
  tooltip.style.padding = '5px';
  tooltip.style.zIndex = 1000;
  tooltip.innerHTML = `
    <div>${word}: ${translation}</div>
    <button id="addToWordList">加入生词本</button>
  `;

  document.body.appendChild(tooltip);

  document.getElementById('addToWordList').addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'addToWordList', word: word });
    document.body.removeChild(tooltip);
  });

  setTimeout(() => {
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
    }
  }, 5000);
}
