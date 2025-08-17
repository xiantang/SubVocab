document.addEventListener('dblclick', function(event) {
  const target = event.target;
  
  // 检查是否直接点击在高亮的span上
  if (target && target.tagName === 'SPAN' && target.dataset.word) {
    const word = target.dataset.word;
    console.log('点击已高亮单词:', word);
    showRemoveConfirmation(word, event.clientX, event.clientY);
    return;
  }
  
  // 检查是否点击在字幕区域
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
        
        // 检查单词是否已经在生词本中
        chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
          if (response && response.wordList) {
            const isInWordList = response.wordList.some(item => item.word.toLowerCase() === word.toLowerCase());
            if (isInWordList) {
              // 如果单词已在生词本中，显示删除确认
              showRemoveConfirmation(word, event.clientX, event.clientY);
            } else {
              // 如果单词未在生词本中，翻译并显示tooltip
              const sentence = getSentenceContext(textContent, wordStart, wordEnd);
              translateWordWithContext(word, sentence, event.clientX, event.clientY);
            }
          } else {
            // 无法获取生词本，直接翻译
            const sentence = getSentenceContext(textContent, wordStart, wordEnd);
            translateWordWithContext(word, sentence, event.clientX, event.clientY);
          }
        });
      }
    }
  }
});

function showRemoveConfirmation(word, x, y) {
  // 移除已存在的确认框
  const existingTooltip = document.querySelector('.remove-confirmation-tooltip');
  if (existingTooltip) {
    document.body.removeChild(existingTooltip);
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'remove-confirmation-tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.backgroundColor = 'white';
  tooltip.style.border = '1px solid black';
  tooltip.style.padding = '10px';
  tooltip.style.zIndex = 1000;
  tooltip.style.borderRadius = '5px';
  tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  
  const uniqueId = Date.now();
  tooltip.innerHTML = `
    <div style="margin-bottom: 8px;">
      <strong>${word}</strong> 已在生词本中
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="removeBtn_${uniqueId}" style="background-color: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">移除</button>
      <button id="cancelBtn_${uniqueId}" style="background-color: #888; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">取消</button>
    </div>
  `;

  document.body.appendChild(tooltip);

  document.getElementById(`removeBtn_${uniqueId}`).addEventListener('click', function() {
    removeFromWordList(word);
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
    }
  });

  document.getElementById(`cancelBtn_${uniqueId}`).addEventListener('click', function() {
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
    }
  });

  // 点击其他地方关闭tooltip
  const closeHandler = function(event) {
    if (!tooltip.contains(event.target)) {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
      document.removeEventListener('click', closeHandler);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeHandler);
  }, 100);

  // 5秒后自动关闭
  setTimeout(() => {
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
      document.removeEventListener('click', closeHandler);
    }
  }, 5000);
}

function getSentenceContext(textContent, wordStart, wordEnd) {
  // 获取完整的句子作为语境
  let sentenceStart = 0;
  let sentenceEnd = textContent.length;
  
  // 向前查找句号、感叹号、问号等句子分隔符
  for (let i = wordStart - 1; i >= 0; i--) {
    if (/[.!?]/.test(textContent[i])) {
      sentenceStart = i + 1;
      break;
    }
  }
  
  // 向后查找句号、感叹号、问号等句子分隔符
  for (let i = wordEnd; i < textContent.length; i++) {
    if (/[.!?]/.test(textContent[i])) {
      sentenceEnd = i + 1;
      break;
    }
  }
  
  return textContent.substring(sentenceStart, sentenceEnd).trim();
}

function translateWordWithContext(word, sentence, x, y) {
  // 首先检查是否有OpenAI API Key
  chrome.storage.local.get({ openaiApiKey: '' }, function(result) {
    if (result.openaiApiKey) {
      // 使用OpenAI翻译
      translateWithOpenAI(word, sentence, x, y);
    } else {
      // 回退到原来的翻译方式
      translateWord(word, x, y);
    }
  });
}

async function translateWithOpenAI(word, sentence, x, y) {
  chrome.storage.local.get({ openaiApiKey: '' }, async function(result) {
    const apiKey = result.openaiApiKey;
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的英语翻译助手。请根据给定的句子语境，为指定的英文单词提供最准确的中文翻译。只需要返回翻译结果，不需要其他解释。'
            },
            {
              role: 'user',
              content: `请翻译句子"${sentence}"中的单词"${word}"。只返回中文翻译，不要其他内容。`
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translation = data.choices[0].message.content.trim();
        showTooltip(word, translation, x, y);
      } else {
        console.error('OpenAI API请求失败:', response.status);
        // 回退到原来的翻译方式
        translateWord(word, x, y);
      }
    } catch (error) {
      console.error('OpenAI翻译失败:', error);
      // 回退到原来的翻译方式
      translateWord(word, x, y);
    }
  });
}

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
  // 移除已存在的翻译框
  const existingTooltip = document.querySelector('.translation-tooltip');
  if (existingTooltip) {
    document.body.removeChild(existingTooltip);
  }

  const tooltip = document.createElement('div');
  tooltip.className = 'translation-tooltip';
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  tooltip.style.backgroundColor = 'white';
  tooltip.style.border = '1px solid black';
  tooltip.style.padding = '10px';
  tooltip.style.zIndex = 1000;
  tooltip.style.borderRadius = '5px';
  tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  
  const uniqueId = Date.now();
  tooltip.innerHTML = `
    <div style="margin-bottom: 8px;">
      <strong>${word}</strong>: ${translation}
    </div>
    <div style="display: flex; gap: 8px;">
      <button id="addBtn_${uniqueId}" style="background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">加入生词本</button>
      <button id="cancelAddBtn_${uniqueId}" style="background-color: #888; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">取消</button>
    </div>
  `;

  document.body.appendChild(tooltip);

  document.getElementById(`addBtn_${uniqueId}`).addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'addToWordList', word: word }, (response) => {
      console.log('添加单词到生词本:', response);
      highlightWord(word);
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    });
  });

  document.getElementById(`cancelAddBtn_${uniqueId}`).addEventListener('click', function() {
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
    }
  });

  // 点击其他地方关闭tooltip
  const closeHandler = function(event) {
    if (!tooltip.contains(event.target)) {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
      document.removeEventListener('click', closeHandler);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', closeHandler);
  }, 100);

  // 5秒后自动关闭
  setTimeout(() => {
    if (document.body.contains(tooltip)) {
      document.body.removeChild(tooltip);
      document.removeEventListener('click', closeHandler);
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
function initializeHighlights() {
  chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
    if (response && response.wordList) {
      response.wordList.forEach(item => highlightWord(item.word));
    }
  });
}

// 页面加载后执行
setTimeout(initializeHighlights, 1000);

// 监听页面变化，重新应用高亮
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(initializeHighlights, 2000); // 等待新页面加载
  }
});
urlObserver.observe(document, { subtree: true, childList: true });

// 监听 YouTube 字幕变化
function observeCaptions() {
  const captionsContainer = document.querySelector('.ytp-caption-window-container');
  if (captionsContainer) {
    const observer = new MutationObserver(() => {
      chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
        if (response && response.wordList) {
          response.wordList.forEach(item => highlightWord(item.word));
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
    // 检查是否已经包含该单词的高亮
    const existingHighlight = element.querySelector(`span[data-word="${word}"]`);
    if (existingHighlight) {
      continue; // 已经高亮，跳过
    }
    
    const text = element.innerText;
    if (text.includes(word)) {
      // 使用正则表达式匹配完整单词，并添加data-word属性
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      element.innerHTML = text.replace(regex, `<span style="background-color: #FFD700;" data-word="${word}">${word}</span>`);
    }
  }
}
