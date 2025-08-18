// Enable caption text selection with modifier key dragging support
function enableCaptionTextSelection() {
  const style = document.createElement('style');
  style.textContent = `
    .ytp-caption-segment {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      cursor: text !important;
    }
    .highlighted-word {
      cursor: text !important;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
    /* Dynamic cursor based on modifier keys */
    .ytp-caption-segment.drag-mode {
      cursor: move !important;
    }
    .ytp-caption-segment.drag-mode * {
      cursor: move !important;
    }
    /* Disable caption container dragging by default, but allow when in drag mode */
    .ytp-caption-window-container:not(.allow-drag),
    .ytp-caption-window-container:not(.allow-drag) *,
    .ytp-caption-segment:not(.allow-drag),
    .ytp-caption-segment:not(.allow-drag) * {
      -webkit-user-drag: none !important;
      -khtml-user-drag: none !important;
      -moz-user-drag: none !important;
      -o-user-drag: none !important;
      user-drag: none !important;
      drag: none !important;
      -webkit-touch-callout: none !important;
    }
    /* Enable dragging when in drag mode */
    .ytp-caption-window-container.allow-drag,
    .ytp-caption-window-container.allow-drag *,
    .ytp-caption-segment.allow-drag,
    .ytp-caption-segment.allow-drag * {
      -webkit-user-drag: auto !important;
      -khtml-user-drag: auto !important;
      -moz-user-drag: auto !important;
      -o-user-drag: auto !important;
      user-drag: auto !important;
      drag: auto !important;
    }
  `;
  document.head.appendChild(style);
  
  // Handle caption container with modifier key support
  const captionContainer = document.querySelector('.ytp-caption-window-container');
  if (captionContainer) {
    // Set container and all child elements as non-draggable by default
    const setNotDraggable = (element) => {
      element.draggable = false;
      element.setAttribute('draggable', 'false');
      // Recursively handle all child elements
      Array.from(element.children).forEach(child => setNotDraggable(child));
    };
    
    setNotDraggable(captionContainer);
    
    // Precise mouse event handling with modifier key detection
    let isMouseDownOnCaption = false;
    let isDragMode = false;
    let startX = 0;
    let startY = 0;
    let lastMoveX = 0;
    let lastMoveY = 0;
    
    // Function to check if modifier keys are pressed
    const hasModifierKey = (e) => {
      return e.altKey || e.ctrlKey || e.metaKey;
    };
    
    // Update cursor and drag state based on modifier keys
    const updateCursor = (e) => {
      const captionSegments = document.querySelectorAll('.ytp-caption-segment');
      const hasModifier = hasModifierKey(e);
      
      captionSegments.forEach(segment => {
        if (hasModifier) {
          segment.classList.add('drag-mode');
          segment.classList.add('allow-drag');
          segment.draggable = true;
          segment.setAttribute('draggable', 'true');
        } else {
          segment.classList.remove('drag-mode');
          segment.classList.remove('allow-drag');
          segment.draggable = false;
          segment.setAttribute('draggable', 'false');
        }
      });
      
      // Also update the container
      if (hasModifier) {
        captionContainer.classList.add('allow-drag');
        captionContainer.draggable = true;
        captionContainer.setAttribute('draggable', 'true');
      } else {
        captionContainer.classList.remove('allow-drag');
        captionContainer.draggable = false;
        captionContainer.setAttribute('draggable', 'false');
      }
    };
    
    // Listen for keydown/keyup to update cursor
    document.addEventListener('keydown', updateCursor);
    document.addEventListener('keyup', updateCursor);
    
    // Create separate event handlers for each mode
    let textSelectionListeners = null;
    let currentMode = 'text'; // 'text' or 'drag'
    
    // Text selection mousedown handler
    const textSelectionMouseDown = function(e) {
      if (e.target.closest('.ytp-caption-segment')) {
        console.log('TEXT SELECTION MODE: Handling mousedown');
        
        isMouseDownOnCaption = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Block all default drag behavior
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Start text selection
        const range = document.caretRangeFromPoint(e.clientX, e.clientY);
        if (range) {
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          selection.collapseToStart();
        }
        
        return false;
      }
    };
    
    // Function to switch between modes
    const switchToMode = (newMode) => {
      if (currentMode === newMode) return;
      
      console.log('Switching from', currentMode, 'to', newMode);
      
      if (newMode === 'drag') {
        // Remove text selection event listeners
        captionContainer.removeEventListener('mousedown', textSelectionMouseDown, true);
        
        // Enable drag CSS and attributes
        const captionSegments = document.querySelectorAll('.ytp-caption-segment');
        captionSegments.forEach(segment => {
          segment.classList.add('allow-drag');
          segment.draggable = true;
          segment.setAttribute('draggable', 'true');
        });
        captionContainer.classList.add('allow-drag');
        captionContainer.draggable = true;
        captionContainer.setAttribute('draggable', 'true');
        
      } else { // text mode
        // Add text selection event listener
        captionContainer.addEventListener('mousedown', textSelectionMouseDown, true);
        
        // Disable drag CSS and attributes
        const captionSegments = document.querySelectorAll('.ytp-caption-segment');
        captionSegments.forEach(segment => {
          segment.classList.remove('allow-drag');
          segment.draggable = false;
          segment.setAttribute('draggable', 'false');
        });
        captionContainer.classList.remove('allow-drag');
        captionContainer.draggable = false;
        captionContainer.setAttribute('draggable', 'false');
      }
      
      currentMode = newMode;
    };
    
    // Monitor keyboard state and switch modes
    const keyboardHandler = (e) => {
      const shouldBeDragMode = hasModifierKey(e);
      switchToMode(shouldBeDragMode ? 'drag' : 'text');
    };
    
    document.addEventListener('keydown', keyboardHandler);
    document.addEventListener('keyup', keyboardHandler);
    
    // Initialize in text selection mode
    switchToMode('text');
    
    // Handle mousemove - only intercept in text selection mode
    document.addEventListener('mousemove', function(e) {
      // Only handle if we're in text selection mode and mouse is down
      if (isMouseDownOnCaption && currentMode === 'text') {
        // Text selection mode - manually implement text selection
        console.log('Manual text selection handling');
        
        // Completely prevent all default behavior and event propagation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Manually implement text selection
        try {
          const startRange = document.caretRangeFromPoint(startX, startY);
          const endRange = document.caretRangeFromPoint(e.clientX, e.clientY);
          
          if (startRange && endRange) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            
            // Create selection range
            const range = document.createRange();
            
            // Determine selection direction
            const compareResult = startRange.compareBoundaryPoints(Range.START_TO_START, endRange);
            if (compareResult <= 0) {
              // Left to right selection
              range.setStart(startRange.startContainer, startRange.startOffset);
              range.setEnd(endRange.startContainer, endRange.startOffset);
            } else {
              // Right to left selection
              range.setStart(endRange.startContainer, endRange.startOffset);
              range.setEnd(startRange.startContainer, startRange.startOffset);
            }
            
            selection.addRange(range);
            console.log('Manual selection:', selection.toString());
          }
        } catch (error) {
          console.log('Error in manual selection:', error);
        }
        
        lastMoveX = e.clientX;
        lastMoveY = e.clientY;
        return false;
      }
      // If not in text selection mode, don't interfere at all
    }, { capture: true, passive: false });
    
    // Handle mouseup event - only intercept in text selection mode
    document.addEventListener('mouseup', function(e) {
      if (isMouseDownOnCaption && currentMode === 'text') {
        console.log('Mouse up in text selection mode, resetting state');
        
        // Only prevent default behavior in text selection mode
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        isMouseDownOnCaption = false;
        return false;
      }
      
      // Reset state regardless
      isMouseDownOnCaption = false;
    }, { capture: true });
    
    // Simple drag event prevention - only block in text selection mode
    const preventDragInTextMode = function(e) {
      if (e.target.closest('.ytp-caption-window-container') && currentMode === 'text') {
        console.log('TEXT SELECTION MODE: Preventing drag event:', e.type);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      // In drag mode, don't interfere at all
    };
    
    const dragEvents = ['dragstart', 'drag', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'];
    dragEvents.forEach(eventType => {
      document.addEventListener(eventType, preventDragInTextMode, { capture: true, passive: false });
    });
    
    // Use MutationObserver to handle newly added elements based on current mode
    const dragObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('ytp-caption-segment')) {
            // Apply current mode settings to new elements
            if (currentMode === 'drag') {
              node.classList.add('allow-drag');
              node.draggable = true;
              node.setAttribute('draggable', 'true');
            } else {
              node.classList.remove('allow-drag');
              node.draggable = false;
              node.setAttribute('draggable', 'false');
            }
          }
        });
      });
    });
    
    dragObserver.observe(captionContainer, { childList: true, subtree: true });
  }
}

// Enable text selection and drag prevention after page load
setTimeout(() => {
  enableCaptionTextSelection();
  addDragPreventionToNewCaptions();
}, 1000);

document.addEventListener('dblclick', function(event) {
  const target = event.target;
  
  // Check if directly clicked on highlighted span
  if (target && target.tagName === 'SPAN' && target.dataset.word) {
    const word = target.dataset.word;
    console.log('Clicked highlighted word:', word);
    showRemoveConfirmation(word, event.clientX, event.clientY);
    return;
  }
  
  // Check if clicked in caption area
  if (target && target.classList.contains('ytp-caption-segment')) {
    // Check if text is selected, if so don't execute double-click function
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return; // Text is selected, don't execute double-click function
    }
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    const offset = range.startOffset;
    const textNode = range.startContainer;

    console.log('textNode:', textNode);
    if (textNode.nodeType === Node.TEXT_NODE) {
      const textContent = textNode.textContent;
      console.log('textContent:', textContent);

      let wordStart = offset;
      let wordEnd = offset;

      // 向前找到单词的开始 - 匹配字母、数字和连字符
      while (wordStart > 0 && /[a-zA-Z0-9-]/.test(textContent[wordStart - 1])) {
        wordStart--;
      }

      // 向后找到单词的结束 - 匹配字母、数字和连字符
      while (wordEnd < textContent.length && /[a-zA-Z0-9-]/.test(textContent[wordEnd])) {
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
        console.log("openai translation: " + translation)
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

// 存储当前翻译结果的全局变量
let currentTranslation = '';

function showTooltip(word, translation, x, y) {
  // 存储当前翻译结果
  currentTranslation = translation;
  
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
    chrome.runtime.sendMessage({ 
      action: 'addToWordList', 
      word: word, 
      translation: currentTranslation 
    }, (response) => {
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

// 在文档加载完成后检查并高亮已添加的单词和词组
function initializeHighlights() {
  chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
    if (response && response.wordList) {
      response.wordList.forEach(item => {
        if ((item.type || 'word') === 'word') {
          highlightWord(item.word);
        } else if (item.type === 'phrase') {
          highlightPhrase(item.word);
        }
      });
      
      // 为所有已高亮的单词添加hover事件
      setTimeout(() => {
        const highlightedWords = document.querySelectorAll('.highlighted-word');
        highlightedWords.forEach(span => {
          const word = span.dataset.word;
          if (word) {
            addHoverTranslation(span, word);
          }
        });
        
        // 为所有已高亮的词组添加hover事件
        const highlightedPhrases = document.querySelectorAll('.highlighted-phrase');
        highlightedPhrases.forEach(span => {
          const phrase = span.dataset.phrase;
          if (phrase && !span.hasAttribute('data-phrase-hover-added')) {
            addHoverTranslationPhrase(span, phrase);
            span.setAttribute('data-phrase-hover-added', 'true');
          }
        });
      }, 100);
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
    setTimeout(() => {
      enableCaptionTextSelection(); // 重新启用文本选择
      addDragPreventionToNewCaptions(); // 为新页面字幕添加拖拽阻止
      initializeHighlights();
    }, 2000); // 等待新页面加载
  }
});
urlObserver.observe(document, { subtree: true, childList: true });

// 为新字幕元素添加拖拽阻止
function addDragPreventionToNewCaptions() {
  // 简化版本 - 主要逻辑已在enableCaptionTextSelection中处理
  const captionElements = document.querySelectorAll('.ytp-caption-segment');
  captionElements.forEach(element => {
    element.draggable = false;
    element.setAttribute('draggable', 'false');
  });
}

// 监听 YouTube 字幕变化
function observeCaptions() {
  const captionsContainer = document.querySelector('.ytp-caption-window-container');
  if (captionsContainer) {
    const observer = new MutationObserver(() => {
      // 重新启用文本选择（防止YouTube更新后被覆盖）
      enableCaptionTextSelection();
      
      // 为新出现的字幕元素添加拖拽阻止
      setTimeout(() => {
        addDragPreventionToNewCaptions();
      }, 50);
      
      chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
        if (response && response.wordList) {
          response.wordList.forEach(item => {
            if ((item.type || 'word') === 'word') {
              highlightWord(item.word);
            } else if (item.type === 'phrase') {
              highlightPhrase(item.word);
            }
          });
          
          // 为新高亮的单词和词组添加hover事件
          setTimeout(() => {
            const highlightedWords = document.querySelectorAll('.highlighted-word');
            highlightedWords.forEach(span => {
              const word = span.dataset.word;
              if (word && !span.hasAttribute('data-hover-added')) {
                addHoverTranslation(span, word);
                span.setAttribute('data-hover-added', 'true');
              }
            });
            
            const highlightedPhrases = document.querySelectorAll('.highlighted-phrase');
            highlightedPhrases.forEach(span => {
              const phrase = span.dataset.phrase;
              if (phrase && !span.hasAttribute('data-phrase-hover-added')) {
                addHoverTranslationPhrase(span, phrase);
                span.setAttribute('data-phrase-hover-added', 'true');
              }
            });
          }, 100);
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
    
    // 使用innerHTML而不是innerText，这样可以处理已经存在的HTML标签
    const currentHTML = element.innerHTML;
    const text = element.innerText;
    
    if (text.includes(word)) {
      // 创建一个临时div来处理HTML内容
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentHTML;
      
      // 遍历所有文本节点
      const textNodes = getTextNodes(tempDiv);
      textNodes.forEach(textNode => {
        const nodeText = textNode.textContent;
        if (nodeText.includes(word)) {
          const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          if (regex.test(nodeText)) {
            const newHTML = nodeText.replace(regex, `<span style="background-color: #FFD700; user-select: text; -webkit-user-select: text;" data-word="${word}" class="highlighted-word">${word}</span>`);
            const newElement = document.createElement('span');
            newElement.innerHTML = newHTML;
            textNode.parentNode.insertBefore(newElement, textNode);
            textNode.parentNode.removeChild(textNode);
          }
        }
      });
      
      element.innerHTML = tempDiv.innerHTML;
      
      // 为新添加的高亮单词添加hover事件
      const newHighlightedWords = element.querySelectorAll(`span[data-word="${word}"]`);
      newHighlightedWords.forEach(span => {
        addHoverTranslation(span, word);
      });
    }
  }
}

// 获取所有文本节点的辅助函数
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim()) {
      textNodes.push(node);
    }
  }
  
  return textNodes;
}

// 为高亮单词添加hover翻译功能
function addHoverTranslation(span, word) {
  // 避免重复添加事件
  if (span.hasAttribute('data-hover-added')) {
    return;
  }
  span.setAttribute('data-hover-added', 'true');
  
  let hoverTooltip = null;
  let hoverTimeout = null;

  span.addEventListener('mouseenter', function(e) {
    // 延迟显示tooltip，避免快速划过时闪烁
    hoverTimeout = setTimeout(() => {
      // 获取单词的翻译
      chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
        if (response && response.wordList) {
          const wordObj = response.wordList.find(item => item.word.toLowerCase() === word.toLowerCase());
          if (wordObj && wordObj.translation) {
            showHoverTooltip(wordObj.word, wordObj.translation, e.clientX, e.clientY);
          }
        }
      });
    }, 500); // 500ms延迟
  });

  span.addEventListener('mouseleave', function() {
    // 清除延迟显示的timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    // 隐藏tooltip
    hideHoverTooltip();
  });
}

// 显示hover tooltip
function showHoverTooltip(word, translation, x, y) {
  // 移除已存在的hover tooltip
  hideHoverTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'hover-translation-tooltip';
  tooltip.style.position = 'fixed';
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y - 30}px`;
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '6px 10px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.zIndex = '10000';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.maxWidth = '200px';
  tooltip.style.wordWrap = 'break-word';
  
  tooltip.innerHTML = `<strong>${word}</strong>: ${translation}`;
  
  document.body.appendChild(tooltip);
}

// 隐藏hover tooltip
function hideHoverTooltip() {
  const existingTooltip = document.querySelector('.hover-translation-tooltip');
  if (existingTooltip) {
    document.body.removeChild(existingTooltip);
  }
}

// Phrase translation state management
let translationTimer = null;
let currentSelection = null;
let translationPopup = null;
let selectionBounds = null;

// YouTube视频暂停/恢复功能
let wasPlayingBeforeHover = false;
let hoverPauseTimeout = null;

function setupCaptionHoverPause() {
  const captionsContainer = document.querySelector('.ytp-caption-window-container');
  if (captionsContainer) {
    captionsContainer.addEventListener('mouseenter', function() {
      // 延迟暂停，避免快速划过时暂停
      hoverPauseTimeout = setTimeout(() => {
        const video = document.querySelector('video');
        if (video && !video.paused) {
          wasPlayingBeforeHover = true;
          video.pause();
          console.log('字幕悬停：视频已暂停');
        }
      }, 200); // 200ms延迟
    });

    captionsContainer.addEventListener('mouseleave', function() {
      // 清除延迟暂停的timeout
      if (hoverPauseTimeout) {
        clearTimeout(hoverPauseTimeout);
        hoverPauseTimeout = null;
      }
      
      // 如果之前是播放状态，恢复播放
      const video = document.querySelector('video');
      if (video && wasPlayingBeforeHover) {
        video.play();
        wasPlayingBeforeHover = false;
        console.log('字幕离开：视频已恢复播放');
      }
    });
    
    console.log('字幕悬停暂停功能已启用');
  } else {
    // 如果字幕容器还不存在，稍后再试
    setTimeout(setupCaptionHoverPause, 1000);
  }
}

// 启动字幕悬停暂停功能
setupCaptionHoverPause();

// Phrase translation functionality
function setupPhraseTranslation() {
  // Listen for text selection changes
  document.addEventListener('selectionchange', handleSelectionChange);
  
  // Listen for mouse movement to detect leaving selection area
  document.addEventListener('mousemove', handleMouseMove);
  
  // Listen for ESC key to cancel translation
  document.addEventListener('keydown', handleEscapeKey);
}

function handleSelectionChange() {
  const selection = window.getSelection();
  
  // Clear previous timer and popup
  clearTranslationTimer();
  hideTranslationPopup();
  
  if (selection.rangeCount > 0 && !selection.isCollapsed) {
    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    
    // Check if selection is within caption area
    if (!isSelectionInCaptions(range)) {
      return;
    }
    
    // Check if selection is valid (more than 1 character, contains spaces for phrases)
    if (selectedText.length > 1 && selectedText.includes(' ')) {
      console.log('Phrase selected:', selectedText);
      
      // Store current selection info
      currentSelection = {
        text: selectedText,
        range: range.cloneRange(),
        rect: range.getBoundingClientRect()
      };
      
      // Calculate selection bounds for mouse tracking
      selectionBounds = calculateSelectionBounds(range);
      
      // Start timer for delayed translation
      translationTimer = setTimeout(() => {
        translateSelectedPhrase(selectedText, currentSelection.rect);
      }, 1500); // 1.5 second delay
    }
  } else {
    // Clear state when no selection
    currentSelection = null;
    selectionBounds = null;
  }
}

function isSelectionInCaptions(range) {
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
  return element.closest('.ytp-caption-segment') !== null;
}

function calculateSelectionBounds(range) {
  const rect = range.getBoundingClientRect();
  const margin = 20; // 20px margin around selection
  
  return {
    left: rect.left - margin,
    right: rect.right + margin,
    top: rect.top - margin,
    bottom: rect.bottom + margin
  };
}

function handleMouseMove(e) {
  if (selectionBounds && translationTimer) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Check if mouse is outside selection bounds
    if (mouseX < selectionBounds.left || 
        mouseX > selectionBounds.right || 
        mouseY < selectionBounds.top || 
        mouseY > selectionBounds.bottom) {
      
      console.log('Mouse left selection area, cancelling translation');
      clearTranslationTimer();
      currentSelection = null;
      selectionBounds = null;
    }
  }
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') {
    console.log('ESC pressed, cancelling translation');
    clearTranslationTimer();
    hideTranslationPopup();
    
    // Also clear selection
    const selection = window.getSelection();
    selection.removeAllRanges();
    
    currentSelection = null;
    selectionBounds = null;
  }
}

function clearTranslationTimer() {
  if (translationTimer) {
    clearTimeout(translationTimer);
    translationTimer = null;
    console.log('Translation timer cleared');
  }
}

function hideTranslationPopup() {
  if (translationPopup && document.body.contains(translationPopup)) {
    document.body.removeChild(translationPopup);
    translationPopup = null;
  }
}

function translateSelectedPhrase(phrase, rect) {
  console.log('Translating phrase:', phrase);
  
  // Get sentence context for better translation
  const fullContext = getFullCaptionContext();
  
  // Use existing translation function with context
  chrome.storage.local.get({ openaiApiKey: '' }, function(result) {
    if (result.openaiApiKey) {
      // Use OpenAI translation for phrases
      translatePhraseWithOpenAI(phrase, fullContext, rect.left + rect.width/2, rect.bottom + 10);
    } else {
      // Fallback to basic translation
      translatePhraseBasic(phrase, rect.left + rect.width/2, rect.bottom + 10);
    }
  });
}

function getFullCaptionContext() {
  const captionSegments = document.querySelectorAll('.ytp-caption-segment');
  let context = '';
  
  captionSegments.forEach(segment => {
    const text = segment.innerText.trim();
    if (text) {
      context += text + ' ';
    }
  });
  
  return context.trim();
}

async function translatePhraseWithOpenAI(phrase, context, x, y) {
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
              content: '你是一个专业的英语翻译助手。请根据给定的句子语境，为指定的英文短语或句子提供最准确的中文翻译。只需要返回翻译结果，不需要其他解释。'
            },
            {
              role: 'user',
              content: `请翻译以下英文短语或句子："${phrase}"。\n\n语境：${context}\n\n只返回中文翻译，不要其他内容。`
            }
          ],
          max_tokens: 150,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translation = data.choices[0].message.content.trim();
        console.log("OpenAI phrase translation:", translation);
        showPhraseTranslationPopup(phrase, translation, x, y);
      } else {
        console.error('OpenAI API请求失败:', response.status);
        translatePhraseBasic(phrase, x, y);
      }
    } catch (error) {
      console.error('OpenAI翻译失败:', error);
      translatePhraseBasic(phrase, x, y);
    }
  });
}

function translatePhraseBasic(phrase, x, y) {
  const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(phrase)}&langpair=en|zh-CN`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.responseData && data.responseData.translatedText) {
        const translation = data.responseData.translatedText;
        showPhraseTranslationPopup(phrase, translation, x, y);
      } else {
        console.error('Translation failed');
      }
    })
    .catch(error => {
      console.error('翻译失败:', error);
    });
}

function showPhraseTranslationPopup(phrase, translation, x, y) {
  // Remove any existing popup
  hideTranslationPopup();
  
  const popup = document.createElement('div');
  popup.className = 'phrase-translation-popup';
  translationPopup = popup;
  
  // Position the popup
  popup.style.position = 'fixed';
  popup.style.left = `${Math.min(x, window.innerWidth - 300)}px`;
  popup.style.top = `${Math.min(y, window.innerHeight - 180)}px`;
  popup.style.backgroundColor = 'white';
  popup.style.border = '2px solid #4CAF50';
  popup.style.borderRadius = '8px';
  popup.style.padding = '15px';
  popup.style.zIndex = '10000';
  popup.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  popup.style.maxWidth = '300px';
  popup.style.fontSize = '14px';
  popup.style.fontFamily = 'Arial, sans-serif';
  
  const uniqueId = Date.now();
  
  // Check if phrase already exists in word list
  chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
    const isInWordList = response && response.wordList ? 
      response.wordList.some(item => item.word.toLowerCase() === phrase.toLowerCase() && item.type === 'phrase') : 
      false;
    
    popup.innerHTML = `
      <div style="margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        <div style="font-weight: bold; color: #333; margin-bottom: 4px;">选中的短语：</div>
        <div style="font-style: italic; color: #666;">"${phrase}"</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-weight: bold; color: #333; margin-bottom: 4px;">翻译：</div>
        <div style="color: #2c3e50;">${translation}</div>
      </div>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        ${isInWordList ? 
          `<button id="removePhraseBtn_${uniqueId}" style="background-color: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">移除词组</button>` :
          `<button id="addPhraseBtn_${uniqueId}" style="background-color: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">加入生词本</button>`
        }
        <button id="closeBtn_${uniqueId}" style="background-color: #95a5a6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">关闭</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Add button functionality
    if (isInWordList) {
      document.getElementById(`removePhraseBtn_${uniqueId}`).addEventListener('click', function() {
        removePhraseFromWordList(phrase);
        hideTranslationPopup();
      });
    } else {
      document.getElementById(`addPhraseBtn_${uniqueId}`).addEventListener('click', function() {
        addPhraseToWordList(phrase, translation);
        hideTranslationPopup();
      });
    }

    // Add close button functionality
    document.getElementById(`closeBtn_${uniqueId}`).addEventListener('click', function() {
      hideTranslationPopup();
    });
  });

  // Auto-close after 10 seconds (extended for phrase actions)
  setTimeout(() => {
    hideTranslationPopup();
  }, 10000);

  // Close when clicking outside
  const outsideClickHandler = function(event) {
    if (popup && !popup.contains(event.target)) {
      hideTranslationPopup();
      document.removeEventListener('click', outsideClickHandler);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler);
  }, 100);
}

// Phrase management functions
function addPhraseToWordList(phrase, translation) {
  chrome.runtime.sendMessage({ 
    action: 'addToWordList', 
    word: phrase, 
    translation: translation,
    type: 'phrase'
  }, (response) => {
    if (response && response.success) {
      console.log('Added phrase to word list:', phrase);
      highlightPhrase(phrase);
    } else {
      console.log('Phrase already in word list or failed to add:', phrase);
    }
  });
}

function removePhraseFromWordList(phrase) {
  chrome.runtime.sendMessage({ 
    action: 'removeFromWordList', 
    word: phrase,
    type: 'phrase'
  }, (response) => {
    if (response && response.success) {
      console.log('Removed phrase from word list:', phrase);
      removeHighlightPhrase(phrase);
    } else {
      console.error('Failed to remove phrase:', phrase);
    }
  });
}

function highlightPhrase(phrase) {
  const elements = document.getElementsByClassName('ytp-caption-segment');
  for (let element of elements) {
    // Check if phrase is already highlighted
    const existingHighlight = element.querySelector(`span[data-phrase="${phrase}"]`);
    if (existingHighlight) {
      continue;
    }
    
    const text = element.innerText;
    if (text.includes(phrase)) {
      // Create regex to match the exact phrase with word boundaries
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'gi');
      
      if (regex.test(text)) {
        const currentHTML = element.innerHTML;
        const newHTML = currentHTML.replace(regex, 
          `<span style="background-color: #87CEEB; user-select: text; -webkit-user-select: text; border-radius: 3px; padding: 1px 2px;" data-phrase="${phrase}" class="highlighted-phrase">${phrase}</span>`
        );
        element.innerHTML = newHTML;
        
        // Add hover translation for the highlighted phrase
        const newHighlightedPhrases = element.querySelectorAll(`span[data-phrase="${phrase}"]`);
        newHighlightedPhrases.forEach(span => {
          addHoverTranslationPhrase(span, phrase);
        });
      }
    }
  }
}

function removeHighlightPhrase(phrase) {
  const elements = document.getElementsByClassName('ytp-caption-segment');
  for (let element of elements) {
    const highlightedSpans = element.querySelectorAll(`span[data-phrase="${phrase}"]`);
    highlightedSpans.forEach(span => {
      const textNode = document.createTextNode(phrase);
      span.parentNode.replaceChild(textNode, span);
    });
  }
}

function addHoverTranslationPhrase(span, phrase) {
  // Avoid duplicate event listeners
  if (span.hasAttribute('data-phrase-hover-added')) {
    return;
  }
  span.setAttribute('data-phrase-hover-added', 'true');
  
  let hoverTimeout = null;

  span.addEventListener('mouseenter', function(e) {
    hoverTimeout = setTimeout(() => {
      // Get phrase translation from word list
      chrome.runtime.sendMessage({ action: 'getWordList' }, (response) => {
        if (response && response.wordList) {
          const phraseObj = response.wordList.find(item => 
            item.word.toLowerCase() === phrase.toLowerCase() && item.type === 'phrase'
          );
          if (phraseObj && phraseObj.translation) {
            showHoverTooltipUpdated(phraseObj.word, phraseObj.translation, e.clientX, e.clientY, true);
          }
        }
      });
    }, 500);
  });

  span.addEventListener('mouseleave', function() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    hideHoverTooltip();
  });
}

// Update showHoverTooltip to handle phrases
function showHoverTooltipUpdated(word, translation, x, y, isPhrase = false) {
  hideHoverTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'hover-translation-tooltip';
  tooltip.style.position = 'fixed';
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y - 30}px`;
  tooltip.style.backgroundColor = isPhrase ? 'rgba(30, 60, 114, 0.9)' : 'rgba(0, 0, 0, 0.8)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '6px 10px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.fontSize = '12px';
  tooltip.style.zIndex = '10000';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.maxWidth = isPhrase ? '250px' : '200px';
  tooltip.style.wordWrap = 'break-word';
  
  tooltip.innerHTML = `<strong>${isPhrase ? '词组' : '单词'}: ${word}</strong><br>${translation}`;
  
  document.body.appendChild(tooltip);
}

// Initialize phrase translation functionality
setTimeout(() => {
  setupPhraseTranslation();
  console.log('Phrase translation functionality initialized');
}, 1000);
