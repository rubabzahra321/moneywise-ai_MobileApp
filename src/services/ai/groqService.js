const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  /**
   * Parse expense from natural language text
   */
  async parseExpense(text) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a financial assistant. Parse the following expense text and return ONLY valid JSON.

IMPORTANT: Return a JSON object with these exact fields:
{
  "amount": number,
  "description": string,
  "merchant": string or null,
  "category": string (one of: food, transport, shopping, entertainment, groceries, bills, healthcare, subscriptions, education, travel, other)
}

Examples:
- Input: "Coffee $5 Starbucks" → {"amount": 5, "description": "Coffee", "merchant": "Starbucks", "category": "food"}
- Input: "Uber ride to airport $45.50" → {"amount": 45.50, "description": "Uber ride to airport", "merchant": "Uber", "category": "transport"}
- Input: "Netflix subscription $15.99" → {"amount": 15.99, "description": "Netflix subscription", "merchant": "Netflix", "category": "subscriptions"}

ONLY return the JSON object, no other text.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });
      
      const content = completion.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return null;
      }
    } catch (error) {
      console.error('Groq parse expense error:', error);
      return null;
    }
  }

  /**
   * Generate AI insights from transactions
   */
  async generateInsights(transactions, user) {
    try {
      const summary = transactions.slice(0, 50).map(t => ({
        amount: t.amount,
        category: t.categoryName || t.category,
        description: t.description,
        date: t.date ? t.date.toISOString().split('T')[0] : 'unknown',
      }));

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a financial advisor. Analyze these transactions and provide 3-5 insights.
            
IMPORTANT: Return ONLY a JSON object with an "insights" array.

Format:
{
  "insights": [
    {
      "title": "string (short, catchy title)",
      "description": "string (detailed explanation)",
      "type": "category" | "savings" | "anomaly" | "summary" | "forecast",
      "value": number or null
    }
  ]
}

Rules:
- Each insight must be unique and actionable
- Focus on patterns, savings opportunities, and anomalies
- Keep descriptions concise but informative
- Use the user's currency (${user.currency || 'USD'})`
          },
          {
            role: 'user',
            content: JSON.stringify({
              transactions: summary,
              monthlyBudget: user.monthlyBudget || 0,
              currency: user.currency || 'USD',
              totalTransactions: summary.length,
            })
          }
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });
      
      const content = completion.choices[0].message.content;
      try {
        const result = JSON.parse(content);
        return result.insights || [];
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return result.insights || [];
        }
        return [];
      }
    } catch (error) {
      console.error('Groq generate insights error:', error);
      return [];
    }
  }

  /**
   * Categorize a transaction
   */
  async categorizeTransaction(description, amount) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `Categorize this expense into one of these categories:
            food, transport, shopping, entertainment, groceries, bills, healthcare, subscriptions, education, travel, other.
            
IMPORTANT: Return ONLY a JSON object:
{
  "category": "string (one of the categories above)",
  "confidence": number (0.0 to 1.0)
}

Examples:
- "Pizza delivery" → {"category": "food", "confidence": 0.95}
- "Uber ride" → {"category": "transport", "confidence": 0.92}
- "Amazon purchase" → {"category": "shopping", "confidence": 0.88}`
          },
          { 
            role: 'user', 
            content: `Description: ${description}\nAmount: $${amount || 0}` 
          }
        ],
        temperature: 0.2,
        max_tokens: 100,
        response_format: { type: 'json_object' },
      });
      
      const content = completion.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return { category: 'other', confidence: 0.5 };
      }
    } catch (error) {
      console.error('Groq categorize error:', error);
      return { category: 'other', confidence: 0.5 };
    }
  }

  /**
   * Generate savings tips
   */
  async generateSavingsTips(transactions) {
    try {
      const summary = transactions.slice(0, 30).map(t => ({
        amount: t.amount,
        category: t.categoryName || t.category,
        description: t.description,
      }));

      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Based on these spending patterns, suggest 2-3 specific savings tips.
            
IMPORTANT: Return ONLY a JSON object:
{
  "tips": [
    {
      "tip": "string (specific, actionable advice)",
      "potentialSavings": number (estimated monthly savings in dollars),
      "category": "string (which spending category this applies to)"
    }
  ]
}

Focus on:
- Reducing unnecessary subscriptions
- Finding cheaper alternatives
- Reducing frequency of expensive habits
- Bulk buying opportunities`
          },
          {
            role: 'user',
            content: JSON.stringify(summary)
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });
      
      const content = completion.choices[0].message.content;
      try {
        const result = JSON.parse(content);
        return result.tips || [];
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return result.tips || [];
        }
        return [];
      }
    } catch (error) {
      console.error('Groq generate savings tips error:', error);
      return [];
    }
  }
}

module.exports = new GroqService();