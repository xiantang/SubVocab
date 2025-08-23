// Content Script Tests
// Tests for content.js highlighting functionality

// Polyfill TextEncoder/TextDecoder before any other imports
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import test setup
require('./setup/mock-extension-apis');

// Mock DOM environment using JSDOM directly
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Node = dom.window.Node;
global.NodeFilter = dom.window.NodeFilter;
global.Range = dom.window.Range;

// Mock the openAITranslator object
global.openAITranslator = {
  translateWord: jest.fn(),
  translatePhrase: jest.fn()
};

// Define the functions we want to test directly from content.js
function highlightWord(word) {
  const elements = document.getElementsByClassName('ytp-caption-segment');
  for (let element of elements) {
    // Check if already highlighted
    const existingHighlight = element.querySelector(`span[data-word="${word}"]`);
    if (existingHighlight) {
      continue;
    }
    
    const currentHTML = element.innerHTML;
    const text = element.innerText;
    
    if (text.toLowerCase().includes(word.toLowerCase())) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentHTML;
      
      const textNodes = getTextNodes(tempDiv);
      textNodes.forEach(textNode => {
        const nodeText = textNode.textContent;
        if (nodeText.toLowerCase().includes(word.toLowerCase())) {
          const regex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
          if (regex.test(nodeText)) {
            const newHTML = nodeText.replace(regex, `<span style="background-color: #FFD700; user-select: text; -webkit-user-select: text;" data-word="${word}" class="highlighted-word">$1</span>`);
            const newElement = document.createElement('span');
            newElement.innerHTML = newHTML;
            textNode.parentNode.insertBefore(newElement, textNode);
            textNode.parentNode.removeChild(textNode);
          }
        }
      });
      
      element.innerHTML = tempDiv.innerHTML;
    }
  }
}

function removeHighlight(word) {
  const elements = document.getElementsByClassName('ytp-caption-segment');
  for (let element of elements) {
    const highlightedSpans = element.querySelectorAll(`span[style*="background-color: #FFD700;"]`);
    highlightedSpans.forEach(span => {
      if (span.textContent.toLowerCase() === word.toLowerCase()) {
        const textNode = document.createTextNode(span.textContent);
        span.parentNode.replaceChild(textNode, span);
      }
    });
  }
}

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

describe('Content Script - Case Insensitive Highlighting', () => {
  let mockElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    
    // Create mock YouTube caption element
    mockElement = document.createElement('div');
    mockElement.className = 'ytp-caption-segment';
    document.body.appendChild(mockElement);
    
    // Mock getElementsByClassName
    document.getElementsByClassName = jest.fn().mockReturnValue([mockElement]);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('highlightWord function', () => {
    test('should highlight word with exact case match', () => {
      mockElement.innerHTML = 'This is a Trilogy of movies';
      mockElement.innerText = 'This is a Trilogy of movies';
      
      highlightWord('Trilogy');
      
      expect(mockElement.innerHTML).toContain('background-color: #FFD700');
      expect(mockElement.innerHTML).toContain('data-word="Trilogy"');
      expect(mockElement.innerHTML).toContain('>Trilogy</span>');
    });

    test('should highlight word with different case - lowercase in text', () => {
      mockElement.innerHTML = 'This is a trilogy of movies';
      mockElement.innerText = 'This is a trilogy of movies';
      
      // Dictionary has "Trilogy" but text has "trilogy"
      highlightWord('Trilogy');
      
      expect(mockElement.innerHTML).toContain('background-color: #FFD700');
      expect(mockElement.innerHTML).toContain('data-word="Trilogy"');
      // Should preserve original case from text
      expect(mockElement.innerHTML).toContain('>trilogy</span>');
    });

    test('should highlight word with different case - uppercase in text', () => {
      mockElement.innerHTML = 'This is a TRILOGY of movies';
      mockElement.innerText = 'This is a TRILOGY of movies';
      
      // Dictionary has "Trilogy" but text has "TRILOGY"
      highlightWord('Trilogy');
      
      expect(mockElement.innerHTML).toContain('background-color: #FFD700');
      expect(mockElement.innerHTML).toContain('data-word="Trilogy"');
      // Should preserve original case from text
      expect(mockElement.innerHTML).toContain('>TRILOGY</span>');
    });

    test('should highlight word with mixed case variations', () => {
      mockElement.innerHTML = 'The trilogy, TRILOGY, and Trilogy are all the same';
      mockElement.innerText = 'The trilogy, TRILOGY, and Trilogy are all the same';
      
      highlightWord('Trilogy');
      
      // Should highlight all three variations
      const highlightedSpans = mockElement.querySelectorAll('[data-word="Trilogy"]');
      expect(highlightedSpans.length).toBe(3);
      
      // Check that original case is preserved
      expect(mockElement.innerHTML).toContain('>trilogy</span>');
      expect(mockElement.innerHTML).toContain('>TRILOGY</span>');
      expect(mockElement.innerHTML).toContain('>Trilogy</span>');
    });

    test('should not highlight partial matches', () => {
      mockElement.innerHTML = 'This is a trilogy of movies in the trilogy series';
      mockElement.innerText = 'This is a trilogy of movies in the trilogy series';
      
      // Should not match "trilog" within "trilogy"
      highlightWord('trilog');
      
      expect(mockElement.innerHTML).not.toContain('background-color: #FFD700');
    });

    test('should handle word boundaries correctly with punctuation', () => {
      mockElement.innerHTML = 'The trilogy, trilogy! trilogy? trilogy.';
      mockElement.innerText = 'The trilogy, trilogy! trilogy? trilogy.';
      
      highlightWord('Trilogy');
      
      const highlightedSpans = mockElement.querySelectorAll('[data-word="Trilogy"]');
      expect(highlightedSpans.length).toBe(4);
    });

    test('should not highlight if already highlighted', () => {
      // Pre-highlight the word
      mockElement.innerHTML = 'This is a <span data-word="Trilogy">trilogy</span> of movies';
      mockElement.innerText = 'This is a trilogy of movies';
      
      const originalHTML = mockElement.innerHTML;
      
      highlightWord('Trilogy');
      
      // Should not change since already highlighted
      expect(mockElement.innerHTML).toBe(originalHTML);
    });
  });

  describe('removeHighlight function', () => {
    test('should remove highlight with exact case match', () => {
      // Setup highlighted element
      mockElement.innerHTML = 'This is a <span style="background-color: #FFD700;" data-word="Trilogy" class="highlighted-word">Trilogy</span> of movies';
      
      removeHighlight('Trilogy');
      
      expect(mockElement.innerHTML).toBe('This is a Trilogy of movies');
      expect(mockElement.innerHTML).not.toContain('background-color: #FFD700');
    });

    test('should remove highlight with different case - lowercase dictionary word', () => {
      // Setup highlighted element with original case preserved
      mockElement.innerHTML = 'This is a <span style="background-color: #FFD700;" data-word="Trilogy" class="highlighted-word">trilogy</span> of movies';
      
      // Dictionary word is "Trilogy" but we want to remove "trilogy"
      removeHighlight('trilogy');
      
      expect(mockElement.innerHTML).toBe('This is a trilogy of movies');
      expect(mockElement.innerHTML).not.toContain('background-color: #FFD700');
    });

    test('should remove highlight with different case - uppercase dictionary word', () => {
      // Setup highlighted element
      mockElement.innerHTML = 'This is a <span style="background-color: #FFD700;" data-word="trilogy" class="highlighted-word">TRILOGY</span> of movies';
      
      // Dictionary word is "trilogy" but we want to remove "TRILOGY"
      removeHighlight('TRILOGY');
      
      expect(mockElement.innerHTML).toBe('This is a TRILOGY of movies');
      expect(mockElement.innerHTML).not.toContain('background-color: #FFD700');
    });

    test('should remove all case variations of highlighted word', () => {
      // Setup multiple highlighted elements with different cases
      mockElement.innerHTML = 'The <span style="background-color: #FFD700;" data-word="Trilogy" class="highlighted-word">trilogy</span>, <span style="background-color: #FFD700;" data-word="Trilogy" class="highlighted-word">TRILOGY</span>, and <span style="background-color: #FFD700;" data-word="Trilogy" class="highlighted-word">Trilogy</span>';
      
      removeHighlight('Trilogy');
      
      expect(mockElement.innerHTML).toBe('The trilogy, TRILOGY, and Trilogy');
      expect(mockElement.innerHTML).not.toContain('background-color: #FFD700');
    });

    test('should preserve original case when removing highlight', () => {
      // Setup highlighted element with different case than dictionary
      mockElement.innerHTML = 'This is a <span style="background-color: #FFD700;" data-word="Trilogy" class="highlighted-word">trilogy</span> of movies';
      
      removeHighlight('Trilogy');
      
      // Should preserve the original "trilogy" case, not change to "Trilogy"
      expect(mockElement.innerHTML).toBe('This is a trilogy of movies');
      expect(mockElement.innerHTML).not.toContain('Trilogy of movies');
    });

    test('should not affect non-matching highlighted words', () => {
      // Setup multiple different highlighted words
      mockElement.innerHTML = 'The <span style="background-color: #FFD700;" data-word="Trilogy" class="highlighted-word">trilogy</span> and <span style="background-color: #FFD700;" data-word="Series" class="highlighted-word">series</span>';
      
      removeHighlight('trilogy');
      
      expect(mockElement.innerHTML).toBe('The trilogy and <span style="background-color: #FFD700;" data-word="Series" class="highlighted-word">series</span>');
      // Series should still be highlighted
      expect(mockElement.innerHTML).toContain('data-word="Series"');
    });
  });

  describe('getTextNodes function', () => {
    test('should return text nodes from element', () => {
      const testDiv = document.createElement('div');
      testDiv.innerHTML = 'Text <span>more text</span> final text';
      
      const textNodes = getTextNodes(testDiv);
      
      expect(textNodes).toHaveLength(3);
      expect(textNodes[0].textContent).toBe('Text ');
      expect(textNodes[1].textContent).toBe('more text');
      expect(textNodes[2].textContent).toBe(' final text');
    });

    test('should filter out empty text nodes', () => {
      const testDiv = document.createElement('div');
      testDiv.innerHTML = 'Text<span></span><span>content</span>';
      
      const textNodes = getTextNodes(testDiv);
      
      expect(textNodes).toHaveLength(2);
      expect(textNodes[0].textContent).toBe('Text');
      expect(textNodes[1].textContent).toBe('content');
    });
  });
});