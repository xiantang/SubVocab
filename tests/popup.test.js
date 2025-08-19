// Unit tests for popup.js
// Testing Chrome extension popup functionality

describe('Popup Script', () => {
  let mockWordList;

  beforeEach(() => {
    // Set up DOM structure that matches popup.html
    document.body.innerHTML = `
      <div class="header">
        <h1>生词本</h1>
        <button id="exportBtn" class="export-btn">导出到剪切板</button>
      </div>
      
      <div class="settings-section">
        <h3>设置</h3>
        <div class="setting-item">
          <label for="apiKey">OpenAI API Key:</label>
          <div class="api-key-container">
            <input type="password" id="apiKey" placeholder="请输入OpenAI API Key" />
            <button id="saveApiKey" class="save-btn">保存</button>
          </div>
        </div>
      </div>
      
      <div id="wordList"></div>
    `;

    // Mock word list data
    mockWordList = [
      { word: 'hello', familiarity: 1, translation: '你好', type: 'word' },
      { word: 'world', familiarity: 0, translation: '世界', type: 'word' },
      { word: 'good morning', familiarity: 2, translation: '早上好', type: 'phrase' }
    ];

    // Clear storage and mocks
    mockChromeStorage.clearData();
    
    // Mock window.alert
    global.alert = jest.fn();
    
    // Skip location mocking to avoid JSDOM issues
    // We'll test location.reload indirectly by checking storage updates
  });

  describe('DOMContentLoaded Event', () => {
    test('should load and display API key on initialization', (done) => {
      // Set up storage mock to return API key
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (keys.openaiApiKey !== undefined) {
          callback({ openaiApiKey: 'test-api-key-123' });
        } else {
          callback({ wordList: [] });
        }
      });

      // Load the popup script and trigger DOMContentLoaded
      require('../popup.js');
      
      // Manually dispatch DOMContentLoaded event
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Wait for async operations to complete
      setTimeout(() => {
        const apiKeyInput = document.getElementById('apiKey');
        expect(apiKeyInput.value).toBe('test-api-key-123');
        done();
      }, 10);
    });

    test('should display word list with proper sections', (done) => {
      // Set up storage to return mixed word list
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (keys.openaiApiKey !== undefined) {
          callback({ openaiApiKey: '' });
        } else {
          callback({ wordList: mockWordList });
        }
      });

      // Load the popup script and trigger DOMContentLoaded
      require('../popup.js');
      
      // Manually dispatch DOMContentLoaded event
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        const wordListDiv = document.getElementById('wordList');
        
        // Should have section headers for both words and phrases
        const headers = wordListDiv.querySelectorAll('.section-header');
        expect(headers).toHaveLength(2);
        
        // Check words section header
        expect(headers[0].textContent).toContain('单词 (2)');
        
        // Check phrases section header
        expect(headers[1].textContent).toContain('词组 (1)');
        
        done();
      }, 10);
    });

    test('should display only words when no phrases exist', (done) => {
      const wordsOnly = mockWordList.filter(item => item.type === 'word');
      
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (keys.openaiApiKey !== undefined) {
          callback({ openaiApiKey: '' });
        } else {
          callback({ wordList: wordsOnly });
        }
      });

      require('../popup.js');
      
      // Manually dispatch DOMContentLoaded event
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      setTimeout(() => {
        const wordListDiv = document.getElementById('wordList');
        const headers = wordListDiv.querySelectorAll('.section-header');
        
        // Should have no section headers when only one type exists
        expect(headers).toHaveLength(0);
        
        // Should have word elements
        const wordElements = wordListDiv.querySelectorAll('.word');
        expect(wordElements).toHaveLength(2);
        
        done();
      }, 10);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      // Load popup script and trigger DOMContentLoaded
      require('../popup.js');
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
    });

    test('should export word list to clipboard successfully', (done) => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ wordList: mockWordList });
      });

      // Mock successful clipboard write
      navigator.clipboard.writeText.mockResolvedValue();

      const exportBtn = document.getElementById('exportBtn');
      const originalText = exportBtn.textContent;
      
      exportBtn.click();

      setTimeout(() => {
        // Should have called clipboard with correct text
        const expectedText = mockWordList.map(item => item.word).join('\n');
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedText);
        
        // Should have updated button text
        expect(exportBtn.textContent).toBe('已复制!');
        expect(exportBtn.style.backgroundColor).toBe('rgb(40, 167, 69)');
        
        done();
      }, 10);
    });

    test('should handle empty word list', (done) => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ wordList: [] });
      });

      const exportBtn = document.getElementById('exportBtn');
      exportBtn.click();

      setTimeout(() => {
        expect(global.alert).toHaveBeenCalledWith('生词本为空，无法导出');
        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    test('should handle clipboard write failure', (done) => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ wordList: mockWordList });
      });

      // Mock clipboard failure
      navigator.clipboard.writeText.mockRejectedValue(new Error('Clipboard failed'));
      global.console.error = jest.fn();

      const exportBtn = document.getElementById('exportBtn');
      exportBtn.click();

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith('复制失败:', expect.any(Error));
        expect(global.alert).toHaveBeenCalledWith('复制失败，请手动复制');
        done();
      }, 10);
    });
  });

  describe('API Key Management', () => {
    beforeEach(() => {
      require('../popup.js');
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
    });

    test('should save API key successfully', (done) => {
      const apiKeyInput = document.getElementById('apiKey');
      const saveBtn = document.getElementById('saveApiKey');
      
      apiKeyInput.value = 'new-api-key-456';
      
      chrome.storage.local.set.mockImplementation((data, callback) => {
        expect(data).toEqual({ openaiApiKey: 'new-api-key-456' });
        callback();
      });

      saveBtn.click();

      setTimeout(() => {
        expect(chrome.storage.local.set).toHaveBeenCalledWith(
          { openaiApiKey: 'new-api-key-456' },
          expect.any(Function)
        );
        
        expect(saveBtn.textContent).toBe('已保存');
        expect(saveBtn.style.backgroundColor).toBe('rgb(40, 167, 69)');
        
        done();
      }, 10);
    });

    test('should handle empty API key', (done) => {
      const apiKeyInput = document.getElementById('apiKey');
      const saveBtn = document.getElementById('saveApiKey');
      
      apiKeyInput.value = '   '; // whitespace only
      
      saveBtn.click();

      setTimeout(() => {
        expect(global.alert).toHaveBeenCalledWith('请输入有效的API Key');
        expect(chrome.storage.local.set).not.toHaveBeenCalled();
        done();
      }, 10);
    });

    test('should trim API key before saving', (done) => {
      const apiKeyInput = document.getElementById('apiKey');
      const saveBtn = document.getElementById('saveApiKey');
      
      apiKeyInput.value = '  trimmed-key  ';
      
      chrome.storage.local.set.mockImplementation((data, callback) => {
        expect(data).toEqual({ openaiApiKey: 'trimmed-key' });
        callback();
      });

      saveBtn.click();

      setTimeout(() => {
        expect(chrome.storage.local.set).toHaveBeenCalledWith(
          { openaiApiKey: 'trimmed-key' },
          expect.any(Function)
        );
        done();
      }, 10);
    });
  });

  describe('Word Element Creation and Interactions', () => {
    beforeEach(() => {
      // Set up a word list in storage and load popup
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (keys.openaiApiKey !== undefined) {
          callback({ openaiApiKey: '' });
        } else {
          callback({ wordList: mockWordList });
        }
      });
      
      require('../popup.js');
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
    });

    test('should create word elements with correct styling', (done) => {
      setTimeout(() => {
        const wordElements = document.querySelectorAll('.word');
        const phraseElements = document.querySelectorAll('.phrase');
        
        expect(wordElements).toHaveLength(2);
        expect(phraseElements).toHaveLength(1);
        
        // Check word element structure
        const firstWord = wordElements[0];
        expect(firstWord.querySelector('.word-text')).toBeTruthy();
        expect(firstWord.querySelector('.familiarity')).toBeTruthy();
        expect(firstWord.querySelector('.delete-btn')).toBeTruthy();
        
        // Check phrase element has type badge
        const phrase = phraseElements[0];
        expect(phrase.querySelector('.type-badge')).toBeTruthy();
        expect(phrase.querySelector('.type-badge').textContent).toBe('词组');
        
        done();
      }, 10);
    });

    test('should handle familiarity level clicks', (done) => {
      setTimeout(() => {
        const familiaritySpan = document.querySelector('.familiarity');
        const initialStars = familiaritySpan.textContent;
        
        // Mock storage.set for familiarity update
        chrome.storage.local.set.mockImplementation((data, callback) => {
          if (callback) callback();
        });

        // Click to increase familiarity
        familiaritySpan.click();

        // Should have called storage.set
        expect(chrome.storage.local.set).toHaveBeenCalled();
        
        // Familiarity should cycle (1 -> 2)
        expect(familiaritySpan.textContent).toBe('★★');
        
        done();
      }, 10);
    });

    test('should handle delete button clicks', (done) => {
      setTimeout(() => {
        const deleteBtn = document.querySelector('.delete-btn');
        const wordElement = deleteBtn.closest('.word, .phrase');
        
        // Mock storage.set for deletion
        chrome.storage.local.set.mockImplementation((data, callback) => {
          if (callback) callback();
        });

        deleteBtn.click();

        // Should have called storage.set to remove the word
        expect(chrome.storage.local.set).toHaveBeenCalled();
        
        // Page reload is scheduled but we can't easily test it in JSDOM
        // The important part is that storage was updated
        
        done();
      }, 10);
    });

    test('should apply correct colors based on familiarity levels', (done) => {
      setTimeout(() => {
        const wordElements = document.querySelectorAll('.word, .phrase');
        
        // Test familiarity level 0 (first word has familiarity 1)
        // Test familiarity level 1 
        // Test familiarity level 2 (phrase has familiarity 2)
        
        let foundDifferentColors = false;
        const colors = [];
        
        wordElements.forEach(element => {
          const bgColor = element.style.backgroundColor;
          colors.push(bgColor);
        });
        
        // Should have different background colors for different familiarity levels
        const uniqueColors = [...new Set(colors)];
        expect(uniqueColors.length).toBeGreaterThan(1);
        
        done();
      }, 10);
    });
  });

  describe('Helper Functions', () => {
    test('should return correct colors for word familiarity levels', (done) => {
      // Load popup to initialize functions
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (keys.openaiApiKey !== undefined) {
          callback({ openaiApiKey: '' });
        } else {
          callback({ wordList: [
            { word: 'test0', familiarity: 0, translation: 'test', type: 'word' },
            { word: 'test1', familiarity: 1, translation: 'test', type: 'word' },
            { word: 'test2', familiarity: 2, translation: 'test', type: 'word' },
            { word: 'test3', familiarity: 3, translation: 'test', type: 'word' }
          ] });
        }
      });
      
      require('../popup.js');
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        const wordElements = document.querySelectorAll('.word');
        
        // Test that different familiarity levels get different colors
        expect(wordElements[0].style.backgroundColor).toBe('darkorange'); // familiarity 0
        expect(wordElements[1].style.backgroundColor).toBe('orange');     // familiarity 1
        expect(wordElements[2].style.backgroundColor).toBe('lightyellow'); // familiarity 2
        expect(wordElements[3].style.backgroundColor).toBe('transparent'); // familiarity 3
        done();
      }, 10);
    });

    test('should return correct colors for phrase familiarity levels', (done) => {
      chrome.storage.local.get.mockImplementation((keys, callback) => {
        if (keys.openaiApiKey !== undefined) {
          callback({ openaiApiKey: '' });
        } else {
          callback({ wordList: [
            { word: 'phrase0', familiarity: 0, translation: 'test', type: 'phrase' },
            { word: 'phrase1', familiarity: 1, translation: 'test', type: 'phrase' },
            { word: 'phrase2', familiarity: 2, translation: 'test', type: 'phrase' },
            { word: 'phrase3', familiarity: 3, translation: 'test', type: 'phrase' }
          ] });
        }
      });
      
      require('../popup.js');
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      setTimeout(() => {
        const phraseElements = document.querySelectorAll('.phrase');
        
        // Test that different familiarity levels get different phrase colors
        expect(phraseElements[0].style.backgroundColor).toBe('rgb(176, 224, 230)'); // #B0E0E6
        expect(phraseElements[1].style.backgroundColor).toBe('rgb(173, 216, 230)'); // #ADD8E6  
        expect(phraseElements[2].style.backgroundColor).toBe('rgb(230, 243, 255)'); // #E6F3FF
        expect(phraseElements[3].style.backgroundColor).toBe('transparent');
        done();
      }, 10);
    });
  });
});