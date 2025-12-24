# Backend Services

This directory contains service modules for the Accessibility Analyzer backend.

## Gemini AI Service

### Overview
The `geminiService.js` provides AI-powered accessibility fix suggestions using Google's Gemini AI.

### Configuration

Set these environment variables in your `.env` file:

```env
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.0-flash
AI_FEATURES_ENABLED=true
```

### Supported Models (as of 2025-09-30)

| Model | Status | Speed | Quality | Use Case |
|-------|--------|-------|---------|----------|
| `gemini-2.5-flash` | ✅ Active | Fastest | High | Production (recommended for speed) |
| `gemini-2.5-pro` | ✅ Active | Slower | Highest | Production (recommended for quality) |
| `gemini-2.0-flash` | ✅ Active | Fast | High | Production (current default) |
| `gemini-pro` | ❌ Deprecated | - | - | Do not use |
| `gemini-1.5-flash` | ❌ Deprecated | - | - | Do not use |
| `gemini-1.5-pro` | ❌ Deprecated | - | - | Do not use |

### Usage

```javascript
const geminiService = require('./services/geminiService');

// Check if service is available
if (geminiService.isAvailable()) {
  // Generate AI fix for a violation
  const result = await geminiService.generateAccessibilityFix(violation, context);
  
  console.log(result.aiResponse.explanation);
  console.log(result.aiResponse.solution);
  console.log(result.confidence);
}
```

### API Response Format

```javascript
{
  violationId: "image-alt",
  aiResponse: {
    explanation: "Why this violation matters...",
    solution: {
      summary: "Brief solution description",
      steps: ["Step 1", "Step 2", "Step 3"],
      codeExample: {
        before: "<img src='logo.png'>",
        after: "<img src='logo.png' alt='Company Logo'>"
      }
    },
    wcagReference: "WCAG 2.1 Success Criterion 1.1.1",
    priority: "high",
    estimatedEffort: "5 minutes",
    testingTips: ["Tip 1", "Tip 2"],
    automationScript: "JavaScript code or N/A"
  },
  generatedAt: "2025-09-30T08:49:28.025Z",
  confidence: 0.8
}
```

### Error Handling

The service provides specific error messages:

- **Invalid API Key**: `AI service unavailable: Invalid API key`
- **Quota Exceeded**: `AI service unavailable: API quota exceeded`
- **Network Error**: `AI service unavailable: Network connection failed`
- **Not Configured**: `Gemini API not configured`

### Testing

To test the Gemini service:

```bash
# Create a test file
cat > test-gemini.js << 'EOF'
require('dotenv').config();
const geminiService = require('./services/geminiService');

async function test() {
  const violation = {
    id: 'image-alt',
    impact: 'critical',
    description: 'Images must have alternate text',
    help: 'Ensures <img> elements have alternate text',
    nodes: [{ html: '<img src="logo.png">', target: ['img'] }]
  };
  
  const result = await geminiService.generateAccessibilityFix(violation);
  console.log(JSON.stringify(result, null, 2));
}

test();
EOF

# Run the test
node test-gemini.js
```

### Troubleshooting

#### Service Not Initialized
```
⚠️ Gemini API not configured - AI features will be disabled
```
**Solution**: Set `GEMINI_API_KEY` in your `.env` file

#### 404 Model Not Found
```
models/gemini-pro is not found for API version v1beta
```
**Solution**: Update `GEMINI_MODEL` to a supported model (e.g., `gemini-2.0-flash`)

#### Network Connection Failed
```
AI service unavailable: Network connection failed
```
**Solution**: 
1. Check your internet connection
2. Verify firewall settings allow HTTPS to `generativelanguage.googleapis.com`
3. Check if proxy configuration is needed

#### Invalid API Key
```
AI service unavailable: Invalid API key
```
**Solution**: 
1. Verify your API key in Google Cloud Console
2. Ensure the Generative Language API is enabled
3. Check API key restrictions (if any)

### Performance Optimization

The service is configured with optimal parameters:

```javascript
generationConfig: {
  temperature: 0.7,      // Balanced creativity (0.0 = deterministic, 1.0 = creative)
  topK: 40,              // Consider top 40 tokens
  topP: 0.95,            // Nucleus sampling threshold
  maxOutputTokens: 2048  // Maximum response length
}
```

Adjust these in `geminiService.js` if needed for your use case.

### Rate Limits

Google Gemini API has rate limits:
- **Free tier**: 15 requests per minute
- **Paid tier**: Higher limits based on your plan

Implement caching or rate limiting in your application if needed.

### Best Practices

1. **Cache Responses**: Cache AI responses for common violations
2. **Graceful Degradation**: Handle service unavailability gracefully
3. **Monitor Usage**: Track API usage and costs
4. **Update Models**: Periodically check for newer models
5. **Error Logging**: Log errors for debugging and monitoring

### Links

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Get API Key](https://aistudio.google.com/app/apikey)
- [Pricing](https://ai.google.dev/pricing)

---

Last Updated: 2025-09-30

