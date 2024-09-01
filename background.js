chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'addToWordList',
      title: '加入生词本',
      contexts: ['selection']
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'addToWordList') {
      const word = info.selectionText.trim();
      chrome.storage.local.get({ wordList: [] }, function(result) {
        const wordList = result.wordList;
        wordList.push({ word, familiarity: 0 });
        chrome.storage.local.set({ wordList });
      });
    }
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate') {
      // 使用翻译 API 进行翻译，这里用假数据代替
      const translation = `翻译的${request.word}`;
      sendResponse({ translation });
    } else if (request.action === 'addToWordList') {
      const word = request.word;
      chrome.storage.local.get({ wordList: [] }, function(result) {
        const wordList = result.wordList;
        wordList.push({ word, familiarity: 0 });
        chrome.storage.local.set({ wordList });
      });
    }
  });