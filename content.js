document.addEventListener('dblclick', function(event) {
  const target = event.target;
  if (target && target.classList.contains('ytp-caption-segment')) {
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    const offset = range.startOffset;
    const textNode = range.startContainer;

    console.log('textNode:', textNode);
    if (textNode.nodeType === Node.TEXT_NODE) {
      const textContent = textNode.textContent;
      console.log('textContent:', textContent);

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
      console.log('提取的单词:', word);

      if (word && !word.includes(' ')) { // 检查是否是单词
        console.log('提取的单词:', word);
        
        // 检查单词是否已经高亮
        const highlightedWord = target.querySelector(`span[style*="background-color: #FFD700;"][data-word="${word}"]`);
        if (highlightedWord) {
          // 如果单词已经高亮，从生词本中删除
          removeFromWordList(word);
        } else {
          // 如果单词未高亮，翻译并显示tooltip
          translateWord(word, event.clientX, event.clientY);
        }
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
    chrome.runtime.sendMessage({ action: 'addToWordList', word: word }, (response) => {
      console.log('添加单词到生词本:', response);
        highlightWord(word);
        document.body.removeChild(tooltip);
    });
  });

  setTimeout(() => {
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
    }
  }, 5000);
}

// 添加新函数
function removeFromWordList(word) {
  chrome.runtime.sendMessage({ action: 'removeFromWordList', word: word }, (response) => {
    if (response && response.success) {
      console.log('从生词本中删除单词:', word);
      removeHighlight(word);
    } else {
      console.error('删除单词失败:', word);
    }
  });
}

// 添加新函数
function removeHighlight(word) {
  const elements = document.getElementsByClassName('ytp-caption-segment');
  for (let element of elements) {
    const highlightedSpans = element.querySelectorAll(`span[style*="background-color: #FFD700;"]`);
    highlightedSpans.forEach(span => {
      if (span.textContent === word) {
        const textNode = document.createTextNode(word);
        span.parentNode.replaceChild(textNode, span);
      }
    });
  }
}

// 在文档加载完成后检查并高亮已添加的单词
chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
  if (response && response.wordList) {
    response.wordList.forEach(word => highlightWord(word));
  }
});

// 监听 YouTube 字幕变化
function observeCaptions() {
  const captionsContainer = document.querySelector('.ytp-caption-window-container');
  if (captionsContainer) {
    const observer = new MutationObserver(() => {
      chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
        if (response && response.wordList) {
          response.wordList.forEach(item => highlightWord(item.word));
        } else {
          console.error('无法获取单词列表或列表为空');
        }
      });
    });

    observer.observe(captionsContainer, { childList: true, subtree: true });
  } else {
    // 如果字幕容器还不存在，稍后再试
    setTimeout(observeCaptions, 1000);
  }
}

// 开始观察字幕
observeCaptions();

// 添加新函数
function highlightWord(word) {
  const elements = document.getElementsByClassName('ytp-caption-segment');
  for (let element of elements) {
    const text = element.innerText;
    if (text.includes(word)) {
      element.innerHTML = text.replace(new RegExp(`\\b${word}\\b`, 'g'), `<span style="background-color: #FFD700;">${word}</span>`);
    }
  }
}
