// Test setup that runs after the testing environment is set up
// This file contains common setup for DOM mocking and test utilities

// Mock YouTube DOM elements commonly used in content.js
const mockYouTubeDOM = () => {
  // Create mock caption container
  const captionContainer = document.createElement('div');
  captionContainer.className = 'ytp-caption-window-container';
  
  const captionSegment = document.createElement('div');
  captionSegment.className = 'ytp-caption-segment';
  captionSegment.textContent = 'This is a test caption with some words';
  
  captionContainer.appendChild(captionSegment);
  document.body.appendChild(captionContainer);
  
  // Create mock video element
  const video = document.createElement('video');
  video.currentTime = 0;
  video.duration = 100;
  video.paused = false;
  
  // Mock video methods
  video.play = jest.fn().mockResolvedValue();
  video.pause = jest.fn();
  
  document.body.appendChild(video);
  
  return { captionContainer, captionSegment, video };
};

// Mock DOM selection API
const mockSelection = () => {
  const selection = {
    toString: jest.fn().mockReturnValue(''),
    removeAllRanges: jest.fn(),
    addRange: jest.fn(),
    getRangeAt: jest.fn(),
    rangeCount: 0,
    isCollapsed: true
  };
  
  window.getSelection = jest.fn().mockReturnValue(selection);
  
  // Mock Range API
  const range = {
    setStart: jest.fn(),
    setEnd: jest.fn(),
    cloneRange: jest.fn(),
    getBoundingClientRect: jest.fn().mockReturnValue({
      left: 100,
      top: 100,
      right: 200,
      bottom: 120,
      width: 100,
      height: 20
    }),
    commonAncestorContainer: document.createElement('div'),
    startContainer: document.createElement('div'),
    startOffset: 0,
    compareBoundaryPoints: jest.fn().mockReturnValue(0)
  };
  
  document.createRange = jest.fn().mockReturnValue(range);
  document.caretRangeFromPoint = jest.fn().mockReturnValue(range);
  
  return { selection, range };
};

// Mock clipboard API
const mockClipboard = () => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(),
      readText: jest.fn().mockResolvedValue('')
    }
  });
};

// Mock timer functions for testing async behavior
const mockTimers = () => {
  jest.useFakeTimers();
};

// Clean up function to run after each test
const cleanup = () => {
  // Clear DOM
  document.body.innerHTML = '';
  
  // Clear storage
  if (global.mockChromeStorage) {
    global.mockChromeStorage.clearData();
  }
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear timers
  if (jest.getTimerCount() > 0) {
    jest.clearAllTimers();
  }
};

// Set up global test utilities
global.testUtils = {
  mockYouTubeDOM,
  mockSelection,
  mockClipboard,
  mockTimers,
  cleanup
};

// Set up common mocks
beforeEach(() => {
  mockClipboard();
  mockSelection();
});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.location for tests (if needed)
// We'll mock this in individual tests as needed