document.addEventListener('DOMContentLoaded', function() {
    const wordListDiv = document.getElementById('wordList');
    
    // 加载保存的API Key
    chrome.storage.local.get({ openaiApiKey: '' }, function(result) {
      document.getElementById('apiKey').value = result.openaiApiKey;
    });
  
    chrome.storage.local.get({ wordList: [] }, function(result) {
      const wordList = result.wordList;
      
      // Separate words and phrases
      const words = wordList.filter(item => (item.type || 'word') === 'word');
      const phrases = wordList.filter(item => item.type === 'phrase');
      
      // Add section headers if there are both words and phrases
      if (words.length > 0 && phrases.length > 0) {
        // Words section
        const wordsHeader = document.createElement('div');
        wordsHeader.className = 'section-header';
        wordsHeader.innerHTML = '<h3 style="margin: 10px 0 5px 0; color: #333; font-size: 14px;">单词 (' + words.length + ')</h3>';
        wordListDiv.appendChild(wordsHeader);
      }
      
      // Display words
      words.forEach(wordObj => {
        const wordDiv = createWordElement(wordObj, wordList);
        wordListDiv.appendChild(wordDiv);
      });
      
      // Phrases section
      if (phrases.length > 0) {
        if (words.length > 0) {
          const phrasesHeader = document.createElement('div');
          phrasesHeader.className = 'section-header';
          phrasesHeader.innerHTML = '<h3 style="margin: 15px 0 5px 0; color: #333; font-size: 14px;">词组 (' + phrases.length + ')</h3>';
          wordListDiv.appendChild(phrasesHeader);
        }
        
        phrases.forEach(phraseObj => {
          const phraseDiv = createWordElement(phraseObj, wordList, true);
          wordListDiv.appendChild(phraseDiv);
        });
      }
    });

    // 导出到剪切板功能
    document.getElementById('exportBtn').addEventListener('click', function() {
      chrome.storage.local.get({ wordList: [] }, function(result) {
        const wordList = result.wordList;
        if (wordList.length === 0) {
          alert('生词本为空，无法导出');
          return;
        }

        // 格式化导出内容 - 只复制单词
        const exportText = wordList.map(wordObj => wordObj.word).join('\n');

        // 复制到剪切板
        navigator.clipboard.writeText(exportText).then(function() {
          // 显示成功提示
          const btn = document.getElementById('exportBtn');
          const originalText = btn.textContent;
          btn.textContent = '已复制!';
          btn.style.backgroundColor = '#28a745';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '#007bff';
          }, 2000);
        }).catch(function(err) {
          console.error('复制失败:', err);
          alert('复制失败，请手动复制');
        });
      });
    });

    // 保存API Key功能
    document.getElementById('saveApiKey').addEventListener('click', function() {
      const apiKey = document.getElementById('apiKey').value.trim();
      if (apiKey) {
        chrome.storage.local.set({ openaiApiKey: apiKey }, function() {
          const btn = document.getElementById('saveApiKey');
          const originalText = btn.textContent;
          btn.textContent = '已保存';
          btn.style.backgroundColor = '#28a745';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '#28a745';
          }, 2000);
        });
      } else {
        alert('请输入有效的API Key');
      }
    });
  
    // Helper function to create word/phrase elements
    function createWordElement(wordObj, wordList, isPhrase = false) {
      const wordDiv = document.createElement('div');
      wordDiv.className = isPhrase ? 'phrase' : 'word';
      wordDiv.innerHTML = `
        <div class="word-content">
          <span class="word-text" style="${isPhrase ? 'font-style: italic; color: #2c3e50;' : ''}">${wordObj.word}</span>
          ${wordObj.translation ? `<span class="translation">${wordObj.translation}</span>` : ''}
          ${isPhrase ? '<span class="type-badge" style="background: #87CEEB; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 8px;">词组</span>' : ''}
        </div>
        <span class="familiarity">${'★'.repeat(wordObj.familiarity)}</span>
        <button class="delete-btn">删除</button>
      `;
      wordDiv.style.backgroundColor = isPhrase ? getPhraseColor(wordObj.familiarity) : getColor(wordObj.familiarity);
      wordDiv.style.borderLeft = isPhrase ? '3px solid #87CEEB' : '3px solid transparent';
      
      // 熟悉度点击事件
      wordDiv.querySelector('.familiarity').addEventListener('click', function(e) {
        e.stopPropagation();
        wordObj.familiarity = (wordObj.familiarity + 1) % 4;
        chrome.storage.local.set({ wordList });
        this.textContent = '★'.repeat(wordObj.familiarity);
        wordDiv.style.backgroundColor = isPhrase ? getPhraseColor(wordObj.familiarity) : getColor(wordObj.familiarity);
      });

      // 删除按钮点击事件
      wordDiv.querySelector('.delete-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        const index = wordList.indexOf(wordObj);
        if (index > -1) {
          wordList.splice(index, 1);
          chrome.storage.local.set({ wordList });
          wordDiv.remove();
          // Refresh the display to update counters
          setTimeout(() => location.reload(), 100);
        }
      });
      
      return wordDiv;
    }

    function getColor(familiarity) {
      switch (familiarity) {
        case 0: return 'darkorange';
        case 1: return 'orange';
        case 2: return 'lightyellow';
        default: return 'transparent';
      }
    }
    
    function getPhraseColor(familiarity) {
      switch (familiarity) {
        case 0: return '#B0E0E6'; // Light Blue
        case 1: return '#ADD8E6'; // Light Blue
        case 2: return '#E6F3FF'; // Very Light Blue
        default: return 'transparent';
      }
    }
  });