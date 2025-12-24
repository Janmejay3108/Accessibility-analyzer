import React, { useState } from 'react';
import { 
  SparklesIcon, 
  ClipboardDocumentIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const AIFixDisplay = ({ aiFix, onClose }) => {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = async (text, section) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const { aiResponse, confidence } = aiFix;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="mt-4 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-200 bg-gradient-to-r from-purple-100 to-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-5 w-5 text-purple-600" />
            <h4 className="font-medium text-purple-900">AI-Generated Fix</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Priority & Effort */}
        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(aiResponse.priority)}`}>
            {aiResponse.priority} priority
          </span>
          {aiResponse.estimatedEffort && (
            <span className="text-sm text-gray-600">
              ⏱️ {aiResponse.estimatedEffort}
            </span>
          )}
        </div>

        {/* Explanation */}
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Why This Matters</h5>
          <p className="text-sm text-gray-700">{aiResponse.explanation}</p>
        </div>

        {/* Solution Summary */}
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Solution</h5>
          <p className="text-sm text-gray-700 mb-3">{aiResponse.solution.summary}</p>
          
          {/* Steps */}
          {aiResponse.solution.steps && aiResponse.solution.steps.length > 0 && (
            <div>
              <h6 className="font-medium text-gray-800 mb-2">Steps to Fix:</h6>
              <ol className="list-decimal list-inside space-y-1">
                {aiResponse.solution.steps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-700">{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Code Example */}
        {aiResponse.solution.codeExample && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Code Example</h5>
            
            {aiResponse.solution.codeExample.before && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-red-600">❌ Before (Problematic)</span>
                  <button
                    onClick={() => copyToClipboard(aiResponse.solution.codeExample.before, 'before')}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {copiedSection === 'before' ? (
                      <CheckIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-3 w-3" />
                    )}
                    <span>{copiedSection === 'before' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-red-50 border border-red-200 rounded p-2 text-xs overflow-x-auto">
                  <code>{aiResponse.solution.codeExample.before}</code>
                </pre>
              </div>
            )}

            {aiResponse.solution.codeExample.after && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-green-600">✅ After (Fixed)</span>
                  <button
                    onClick={() => copyToClipboard(aiResponse.solution.codeExample.after, 'after')}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {copiedSection === 'after' ? (
                      <CheckIcon className="h-3 w-3 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="h-3 w-3" />
                    )}
                    <span>{copiedSection === 'after' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-green-50 border border-green-200 rounded p-2 text-xs overflow-x-auto">
                  <code>{aiResponse.solution.codeExample.after}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Automation Script */}
        {aiResponse.automationScript && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Quick Fix Script</h5>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-blue-700 mb-2">
                    Run this in your browser's console to apply the fix automatically:
                  </p>
                  <div className="flex items-center justify-between">
                    <pre className="bg-white border rounded p-2 text-xs overflow-x-auto flex-1 mr-2">
                      <code>{aiResponse.automationScript}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(aiResponse.automationScript, 'script')}
                      className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      {copiedSection === 'script' ? (
                        <CheckIcon className="h-3 w-3 text-green-500" />
                      ) : (
                        <ClipboardDocumentIcon className="h-3 w-3" />
                      )}
                      <span>{copiedSection === 'script' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Testing Tips */}
        {aiResponse.testingTips && aiResponse.testingTips.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Testing Your Fix</h5>
            <ul className="list-disc list-inside space-y-1">
              {aiResponse.testingTips.map((tip, index) => (
                <li key={index} className="text-sm text-gray-700">{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* WCAG Reference */}
        {aiResponse.wcagReference && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>WCAG Reference:</strong> {aiResponse.wcagReference}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFixDisplay;
