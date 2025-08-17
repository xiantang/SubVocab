document.addEventListener('DOMContentLoaded', function() {
    const wordListDiv = document.getElementById('wordList');
  
    chrome.storage.local.get({ wordList: [] }, function(result) {
      const wordList = result.wordList;
      wordList.forEach(wordObj => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        wordDiv.innerHTML = `
          <span class="word-text">${wordObj.word}</span>
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
  
    function getColor(familiarity) {
      switch (familiarity) {
        case 0: return 'darkorange';
        case 1: return 'orange';
        case 2: return 'lightyellow';
        default: return 'transparent';
      }
    }
  });