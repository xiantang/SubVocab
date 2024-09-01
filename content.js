document.addEventListener('click', function(event) {
  const target = event.target;
  if (target && target.classList.contains('ytp-caption-segment')) {
    const text = target.innerText;
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    const offset = range.startOffset;

    let wordStart = offset;
    let wordEnd = offset;

    // 向前找到单词的开始
    while (wordStart > 0 && /\S/.test(text[wordStart - 1])) {
      wordStart--;
    }

    // 向后找到单词的结束
    while (wordEnd < text.length && /\S/.test(text[wordEnd])) {
      wordEnd++;
    }

    const word = text.substring(wordStart, wordEnd).trim();

    if (word && !word.includes(' ')) { // 检查是否是单词
      chrome.runtime.sendMessage({ action: 'translate', word: word }, function(response) {
        if (response && response.translation) {
          alert(`翻译: ${response.translation}`);
        }
      });
    }
  }
});
