// Mock Chrome Extension APIs
// This file sets up comprehensive mocks for all Chrome APIs used in the extension

// Storage mock with persistent data across tests
const storage = {
  local: {
    data: {},
    get: jest.fn().mockImplementation((keys, callback) => {
      const result = {};
      if (typeof keys === 'string') {
        result[keys] = storage.local.data[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          result[key] = storage.local.data[key];
        });
      } else if (typeof keys === 'object') {
        Object.keys(keys).forEach(key => {
          result[key] = storage.local.data[key] || keys[key];
        });
      }
      if (callback) callback(result);
      return Promise.resolve(result);
    }),
    set: jest.fn().mockImplementation((items, callback) => {
      Object.assign(storage.local.data, items);
      if (callback) callback();
      return Promise.resolve();
    }),
    remove: jest.fn().mockImplementation((keys, callback) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => {
        delete storage.local.data[key];
      });
      if (callback) callback();
      return Promise.resolve();
    }),
    clear: jest.fn().mockImplementation((callback) => {
      storage.local.data = {};
      if (callback) callback();
      return Promise.resolve();
    })
  }
};

// Runtime mock for message passing
const runtime = {
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    hasListener: jest.fn()
  },
  onInstalled: {
    addListener: jest.fn()
  },
  sendMessage: jest.fn().mockImplementation((message, callback) => {
    // Simulate async response
    setTimeout(() => {
      if (callback) callback({ success: true });
    }, 0);
  }),
  lastError: null
};

// Context menus mock
const contextMenus = {
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  removeAll: jest.fn(),
  onClicked: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  }
};

// Tabs mock
const tabs = {
  query: jest.fn().mockResolvedValue([]),
  get: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  onUpdated: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  },
  onActivated: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  }
};

// Action mock (for popup)
const action = {
  onClicked: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  },
  setPopup: jest.fn(),
  setTitle: jest.fn(),
  setIcon: jest.fn()
};

// Main chrome object
global.chrome = {
  storage,
  runtime,
  contextMenus,
  tabs,
  action
};

// Utility functions for tests
global.mockChromeStorage = {
  // Helper to set up storage data for tests
  setData: (data) => {
    storage.local.data = { ...storage.local.data, ...data };
  },
  // Helper to clear storage for tests
  clearData: () => {
    storage.local.data = {};
  },
  // Helper to get current storage data
  getData: () => storage.local.data
};

// Mock fetch API for OpenAI calls
global.fetch = jest.fn();

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Export for use in tests
module.exports = {
  mockChromeStorage,
  chrome: global.chrome
};