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
        wordList.push({ word, familiarity: 0, translation: '' });
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
      const translation = request.translation || '';
      const type = request.type || 'word'; // 默认为单词，可以是 'word' 或 'phrase'
      chrome.storage.local.get({ wordList: [] }, function(result) {
        const wordList = result.wordList;
        // Check for duplicates considering both word and type
        if (!wordList.some(item => item.word.toLowerCase() === word.toLowerCase() && (item.type || 'word') === type)) {
          wordList.push({ word, familiarity: 0, translation, type });
          chrome.storage.local.set({ wordList }, () => {
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: false, message: type === 'phrase' ? '词组已存在' : '单词已存在' });
        }
      });
      return true; // 保持消息通道开放
    } else if (request.action === 'getWordList') {
      chrome.storage.local.get({ wordList: [] }, function(result) {
        sendResponse({ wordList: result.wordList });
      });
      return true; // 保持消息通道开放
    } else if (request.action === 'removeFromWordList') {
      const wordToRemove = request.word;
      const typeToRemove = request.type || 'word'; // 默认为单词
      chrome.storage.local.get({ wordList: [] }, function(result) {
        const wordList = result.wordList;
        // Remove considering both word and type
        const updatedWordList = wordList.filter(item => 
          !(item.word.toLowerCase() === wordToRemove.toLowerCase() && (item.type || 'word') === typeToRemove)
        );
        chrome.storage.local.set({ wordList: updatedWordList }, () => {
          sendResponse({ success: true });
        });
      });
      return true; // 保持消息通道开放
    }
  });
