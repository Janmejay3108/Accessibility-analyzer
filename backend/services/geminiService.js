require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.isConfigured = !!process.env.GEMINI_API_KEY;
    this.apiKey = process.env.GEMINI_API_KEY;
    // Use gemini-2.0-flash as the default model (latest, faster and more reliable)
    // Note: gemini-pro is deprecated, use gemini-2.x models instead
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    // Initialize the Google Generative AI client
    if (this.isConfigured) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });
        console.log(`✅ Gemini AI service initialized successfully (model: ${this.modelName})`);
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error.message);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️ Gemini API not configured - AI features will be disabled');
    }
  }

  async generateAccessibilityFix(violation, context = {}) {
    if (!this.isConfigured) {
      throw new Error('Gemini API not configured');
    }

    const prompt = this.buildPrompt(violation, context);

    try {
      console.log(`🤖 Generating AI fix for violation: ${violation.id}`);

      // Use the official Google Generative AI SDK
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ AI response received successfully');
      return this.parseResponse(text, violation);
    } catch (error) {
      console.error('❌ Gemini API error:', error.message);

      // Provide more specific error messages
      if (error.message.includes('API key')) {
        throw new Error('AI service unavailable: Invalid API key');
      } else if (error.message.includes('quota')) {
        throw new Error('AI service unavailable: API quota exceeded');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('AI service unavailable: Network connection failed. Please check your internet connection.');
      } else {
        throw new Error(`AI service unavailable: ${error.message}`);
      }
    }
  }

  buildPrompt(violation, context) {
    return `You are an accessibility expert. Provide a detailed fix for this WCAG violation:

VIOLATION DETAILS:
- Rule ID: ${violation.id}
- Impact: ${violation.impact}
- Description: ${violation.description}
- Help Text: ${violation.help}
- Affected Elements: ${violation.nodes?.length || 0}
- Sample HTML: ${violation.nodes?.[0]?.html || 'Not available'}
- CSS Selector: ${violation.nodes?.[0]?.target?.[0] || 'Not available'}

CONTEXT:
- Website URL: ${context.url || 'Not provided'}
- WCAG Level: ${context.wcagLevel || 'AA'}

IMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.

Provide a JSON response with this exact structure:
{
  "explanation": "Clear explanation of why this is an accessibility issue",
  "solution": {
    "summary": "Brief summary of the fix",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "codeExample": {
      "before": "HTML/CSS before fix",
      "after": "HTML/CSS after fix"
    }
  },
  "wcagReference": "Specific WCAG success criterion",
  "priority": "high|medium|low",
  "estimatedEffort": "5 minutes|30 minutes|2 hours",
  "testingTips": ["How to test the fix", "What to verify"],
  "automationScript": "Optional JavaScript to apply fix automatically"
}

Focus on practical, implementable solutions with clear code examples. Return ONLY the JSON object, nothing else.`;
  }

  parseResponse(responseText, violation) {
    try {
      console.log('🔍 Raw AI response length:', responseText.length);
      console.log('🔍 Raw AI response preview:', responseText.substring(0, 200) + '...');

      // Clean the response text
      let cleanedResponse = responseText.trim();

      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Extract JSON object (find the first { and last })
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = cleanedResponse.substring(firstBrace, lastBrace + 1);
        console.log('🔍 Extracted JSON string length:', jsonStr.length);
        console.log('🔍 Extracted JSON preview:', jsonStr.substring(0, 200) + '...');

        const parsed = JSON.parse(jsonStr);
        
        return {
          violationId: violation.id,
          aiResponse: parsed,
          generatedAt: new Date().toISOString(),
          confidence: this.calculateConfidence(violation, parsed)
        };
      }
      
      // Fallback for non-JSON responses
      return {
        violationId: violation.id,
        aiResponse: {
          explanation: responseText.substring(0, 500),
          solution: {
            summary: "AI provided general guidance",
            steps: ["Review the AI response above"],
            codeExample: { before: "", after: "" }
          },
          wcagReference: violation.help,
          priority: violation.impact === 'critical' ? 'high' : 'medium'
        },
        generatedAt: new Date().toISOString(),
        confidence: 0.6
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Response text that failed to parse:', responseText.substring(0, 500));

      // Return a fallback response instead of throwing an error
      return {
        violationId: violation.id,
        aiResponse: {
          explanation: "The AI service encountered a parsing error. Here's the raw response: " + responseText.substring(0, 300),
          solution: {
            summary: "Manual review required",
            steps: [
              "Review the violation details",
              "Consult WCAG guidelines",
              "Implement appropriate fixes"
            ],
            codeExample: { before: "// Error parsing AI response", after: "// Please review manually" }
          },
          wcagReference: violation.help || "WCAG guidelines",
          priority: violation.impact === 'critical' ? 'high' : 'medium'
        },
        generatedAt: new Date().toISOString(),
        confidence: 0.3
      };
    }
  }

  calculateConfidence(violation, response) {
    let confidence = 0.7; // Base confidence
    
    // Increase confidence based on response completeness
    if (response.codeExample?.before && response.codeExample?.after) confidence += 0.1;
    if (response.steps?.length >= 3) confidence += 0.1;
    if (response.automationScript) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  isAvailable() {
    return this.isConfigured;
  }
}

module.exports = new GeminiService();
