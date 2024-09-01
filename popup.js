document.addEventListener('DOMContentLoaded', function() {
    const wordListDiv = document.getElementById('wordList');
  
    chrome.storage.local.get({ wordList: [] }, function(result) {
      const wordList = result.wordList;
      wordList.forEach(wordObj => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'word';
        wordDiv.innerHTML = `
          <span>${wordObj.word}</span>
          <span>${'★'.repeat(wordObj.familiarity)}</span>
        `;
        wordDiv.style.backgroundColor = getColor(wordObj.familiarity);
        wordDiv.addEventListener('click', function() {
          wordObj.familiarity = (wordObj.familiarity + 1) % 4;
          chrome.storage.local.set({ wordList });
          wordDiv.querySelector('span:nth-child(2)').textContent = '★'.repeat(wordObj.familiarity);
          wordDiv.style.backgroundColor = getColor(wordObj.familiarity);
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