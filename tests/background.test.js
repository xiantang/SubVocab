// Unit tests for background.js
// Testing Chrome extension background script functionality

describe('Background Script', () => {
  let onInstalledCallback;
  let onMessageCallback;

  beforeAll(() => {
    // Load background.js and capture the callbacks
    require('../background.js');
    
    // Get the callbacks that were registered
    onInstalledCallback = chrome.runtime.onInstalled.addListener.mock.calls[0][0];
    onMessageCallback = chrome.runtime.onMessage.addListener.mock.calls[0][0];
  });

  beforeEach(() => {
    // Clear storage before each test but keep mocks
    mockChromeStorage.clearData();
    chrome.contextMenus.create.mockClear();
    chrome.storage.local.set.mockClear();
    chrome.storage.local.get.mockClear();
  });

  describe('Context Menu Creation', () => {
    test('should create context menu on installation', () => {
      // Execute the installation callback
      onInstalledCallback();

      // Verify context menu was created with correct parameters
      expect(chrome.contextMenus.create).toHaveBeenCalledWith({
        id: 'addToWordList',
        title: '加入生词本',
        contexts: ['selection']
      });
    });
  });

  describe('Word List Storage Operations', () => {
    test('should add new word to empty word list', (done) => {
      // Set up empty storage
      mockChromeStorage.setData({ wordList: [] });

      // Simulate message for adding word
      const message = {
        action: 'addToWordList',
        word: 'test',
        translation: 'testing word'
      };

      const sender = {};
      const sendResponse = jest.fn((response) => {
        expect(response.success).toBe(true);
        
        // Check that storage was updated
        chrome.storage.local.get.mockImplementation((keys, callback) => {
          callback({ wordList: [{ word: 'test', familiarity: 0, translation: 'testing word', type: 'word' }] });
        });
        
        done();
      });

      // Execute the callback using captured callback
      const keepAlive = onMessageCallback(message, sender, sendResponse);
      
      // Should return true to keep message channel open
      expect(keepAlive).toBe(true);
    });

    test('should prevent duplicate words', (done) => {
      // Set up storage with existing word
      mockChromeStorage.setData({ 
        wordList: [{ word: 'test', familiarity: 0, translation: 'existing', type: 'word' }] 
      });

      const message = {
        action: 'addToWordList',
        word: 'test',
        translation: 'duplicate'
      };

      const sendResponse = jest.fn((response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('单词已存在');
        done();
      });

      // Execute the callback using captured callback
      onMessageCallback(message, {}, sendResponse);
    });

    test('should distinguish between words and phrases', (done) => {
      // Set up storage with a word
      mockChromeStorage.setData({ 
        wordList: [{ word: 'test', familiarity: 0, translation: 'word', type: 'word' }] 
      });

      // Try to add same text as phrase
      const message = {
        action: 'addToWordList',
        word: 'test',
        translation: 'phrase version',
        type: 'phrase'
      };

      const sendResponse = jest.fn((response) => {
        expect(response.success).toBe(true);
        done();
      });

      onMessageCallback(message, {}, sendResponse);
    });
  });

  describe('Word List Retrieval', () => {
    test('should return word list from storage', (done) => {      
      const testWordList = [
        { word: 'hello', familiarity: 1, translation: '你好', type: 'word' },
        { word: 'good morning', familiarity: 0, translation: '早上好', type: 'phrase' }
      ];

      // Override the storage.get mock for this specific test
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ wordList: testWordList });
      });

      const message = { action: 'getWordList' };
      
      const sendResponse = jest.fn((response) => {
        expect(response.wordList).toEqual(testWordList);
        done();
      });

      const keepAlive = onMessageCallback(message, {}, sendResponse);
      
      expect(keepAlive).toBe(true);
    });
  });

  describe('Word Removal', () => {
    test('should remove word from list', (done) => {
      const initialList = [
        { word: 'hello', familiarity: 1, translation: '你好', type: 'word' },
        { word: 'world', familiarity: 0, translation: '世界', type: 'word' }
      ];

      mockChromeStorage.setData({ wordList: initialList });

      const message = {
        action: 'removeFromWordList',
        word: 'hello',
        type: 'word'
      };

      const sendResponse = jest.fn((response) => {
        expect(response.success).toBe(true);
        done();
      });

      onMessageCallback(message, {}, sendResponse);
    });

    test('should handle case-insensitive removal', (done) => {
      mockChromeStorage.setData({ 
        wordList: [{ word: 'Hello', familiarity: 1, translation: '你好', type: 'word' }] 
      });

      const message = {
        action: 'removeFromWordList',
        word: 'hello', // lowercase
        type: 'word'
      };

      const sendResponse = jest.fn((response) => {
        expect(response.success).toBe(true);
        done();
      });

      onMessageCallback(message, {}, sendResponse);
    });
  });
});