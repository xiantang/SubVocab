document.addEventListener('click', function(event) {
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
        chrome.runtime.sendMessage({ action: 'translate', word: word }, function(response) {
          if (response && response.translation) {
            alert(`翻译: ${response.translation}`);
          }
        });
      }
    }
  }
});
