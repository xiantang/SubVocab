document.addEventListener('DOMContentLoaded', function() {
    const wordListDiv = document.getElementById('wordList');
    
    // 加载保存的API Key
    chrome.storage.local.get({ openaiApiKey: '' }, function(result) {
      document.getElementById('apiKey').value = result.openaiApiKey;
    });
  
    chrome.storage.local.get({ wordList: [] }, function(result) {
      const wordList = result.wordList;
      wordList.forEach(wordObj => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        wordDiv.innerHTML = `
          <div class="word-content">
            <span class="word-text">${wordObj.word}</span>
            ${wordObj.translation ? `<span class="translation">${wordObj.translation}</span>` : ''}
          </div>
          <span class="familiarity">${'★'.repeat(wordObj.familiarity)}</span>
          <button class="delete-btn">删除</button>
        `;
        wordDiv.style.backgroundColor = getColor(wordObj.familiarity);
        // 熟悉度点击事件
        wordDiv.querySelector('.familiarity').addEventListener('click', function(e) {
          e.stopPropagation();
          wordObj.familiarity = (wordObj.familiarity + 1) % 4;
          chrome.storage.local.set({ wordList });
          this.textContent = '★'.repeat(wordObj.familiarity);
          wordDiv.style.backgroundColor = getColor(wordObj.familiarity);
        });

        // 删除按钮点击事件
        wordDiv.querySelector('.delete-btn').addEventListener('click', function(e) {
          e.stopPropagation();
          const index = wordList.indexOf(wordObj);
          if (index > -1) {
            wordList.splice(index, 1);
            chrome.storage.local.set({ wordList });
            wordDiv.remove();
          }
        });
        wordListDiv.appendChild(wordDiv);
      });
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
  
    function getColor(familiarity) {
      switch (familiarity) {
        case 0: return 'darkorange';
        case 1: return 'orange';
        case 2: return 'lightyellow';
        default: return 'transparent';
      }
    }
  });