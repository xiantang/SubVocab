// OpenAI Translation Module
// This module handles all OpenAI-related translation functionality

class OpenAITranslator {
  constructor() {
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
    this.model = 'gpt-3.5-turbo';
  }

  // Get OpenAI API key from Chrome storage
  async getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ openaiApiKey: '' }, (result) => {
        resolve(result.openaiApiKey);
      });
    });
  }

  // Check if OpenAI API key is configured
  async hasApiKey() {
    const apiKey = await this.getApiKey();
    return !!apiKey;
  }

  // Translate a single word with context using OpenAI
  async translateWord(word, sentence, x, y, showTooltipCallback, fallbackTranslateCallback) {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        fallbackTranslateCallback(word, x, y);
        return;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的英语翻译助手。请根据给定的句子语境，为指定的英文单词提供最准确的中文翻译。只需要返回翻译结果，不需要其他解释。'
            },
            {
              role: 'user',
              content: `请翻译句子"${sentence}"中的单词"${word}"。只返回中文翻译，不要其他内容。`
            }
          ],
          max_tokens: 100,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translation = data.choices[0].message.content.trim();
        console.log("openai translation: " + translation);
        showTooltipCallback(word, translation, x, y);
      } else {
        console.error('OpenAI API请求失败:', response.status);
        fallbackTranslateCallback(word, x, y);
      }
    } catch (error) {
      console.error('OpenAI翻译失败:', error);
      fallbackTranslateCallback(word, x, y);
    }
  }

  // Translate a phrase with context using OpenAI
  async translatePhrase(phrase, context, x, y, showPhraseTranslationCallback, fallbackTranslateCallback) {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        fallbackTranslateCallback(phrase, x, y);
        return;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的英语翻译助手。请根据给定的句子语境，为指定的英文短语或句子提供最准确的中文翻译。只需要返回翻译结果，不需要其他解释。'
            },
            {
              role: 'user',
              content: `请翻译以下英文短语或句子："${phrase}"。\n\n语境：${context}\n\n只返回中文翻译，不要其他内容。`
            }
          ],
          max_tokens: 150,
          temperature: 0.3
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translation = data.choices[0].message.content.trim();
        console.log("OpenAI phrase translation:", translation);
        showPhraseTranslationCallback(phrase, translation, x, y);
      } else {
        console.error('OpenAI API请求失败:', response.status);
        fallbackTranslateCallback(phrase, x, y);
      }
    } catch (error) {
      console.error('OpenAI翻译失败:', error);
      fallbackTranslateCallback(phrase, x, y);
    }
  }
}

// Export the translator instance
const openAITranslator = new OpenAITranslator();