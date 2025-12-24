import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { analysisService } from '../../services/api/analysisService';
import AIFixDisplay from './AIFixDisplay';

const AnalysisResults = ({ result, analysis }) => {
  const [expandedViolations, setExpandedViolations] = useState({});
  const [activeTab, setActiveTab] = useState('violations');
  const [aiFixResults, setAiFixResults] = useState({});
  const [loadingAIFix, setLoadingAIFix] = useState({});

  const renderMessageWithGithubLink = (message) => {
    if (!message) return null;
    const githubUrlMatch = String(message).match(/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/i);
    if (!githubUrlMatch) return message;

    const githubUrl = githubUrlMatch[0];
    const parts = String(message).split(githubUrl);
    return (
      <>
        {parts[0]}
        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {githubUrl}
        </a>
        {parts[1]}
      </>
    );
  };

  const formatDuration = (duration) => {
    if (duration === undefined || duration === null) return 'N/A';
    const ms = Number(duration);
    if (Number.isNaN(ms)) return 'N/A';
    if (ms >= 1000) return `${Math.round(ms / 1000)}s`;
    return `${ms}ms`;
  };

  if (!result) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">No results available.</p>
      </div>
    );
  }

  const toggleViolation = (index) => {
    setExpandedViolations(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical':
        return 'text-red-800 bg-red-100 border-red-200';
      case 'serious':
        return 'text-orange-800 bg-orange-100 border-orange-200';
      case 'moderate':
        return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'minor':
        return 'text-blue-800 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return 'text-green-800 bg-green-100';
    if (score >= 70) return 'text-yellow-800 bg-yellow-100';
    return 'text-red-800 bg-red-100';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleAIFix = async (violation, violationIndex) => {
    if (!analysis?.id) return;

    setLoadingAIFix(prev => ({ ...prev, [violationIndex]: true }));

    try {
      const response = await analysisService.generateAIFix(analysis.id, violationIndex);
      setAiFixResults(prev => ({
        ...prev,
        [violationIndex]: response.data.aiFix
      }));
    } catch (error) {
      console.error('Error generating AI fix:', error);

      // Show user-friendly error
      setAiFixResults(prev => ({
        ...prev,
        [violationIndex]: {
          error: true,
          message: error.response?.data?.message || 'AI service is temporarily unavailable'
        }
      }));
    } finally {
      setLoadingAIFix(prev => ({ ...prev, [violationIndex]: false }));
    }
  };

  // Extract data from axeCoreResults or fallback to direct properties
  const violations = result.axeCoreResults?.violations || result.violations || [];
  const passes = result.axeCoreResults?.passes || result.passes || [];
  const incomplete = result.axeCoreResults?.incomplete || result.incomplete || [];
  const complianceScore = result.summary?.complianceScore || result.complianceScore || 0;

  const tabs = [
    { id: 'violations', name: 'Violations', count: violations.length },
    { id: 'passes', name: 'Passes', count: passes.length },
    { id: 'incomplete', name: 'Incomplete', count: incomplete.length },
    { id: 'summary', name: 'Summary', count: null }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getComplianceColor(complianceScore)}`}>
                <span className="text-sm font-bold">{Math.round(complianceScore)}%</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Compliance Score</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(complianceScore)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Violations</p>
              <p className="text-2xl font-semibold text-gray-900">{violations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Passes</p>
              <p className="text-2xl font-semibold text-gray-900">{passes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="w-8 h-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Incomplete</p>
              <p className="text-2xl font-semibold text-gray-900">{incomplete.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count !== null && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'violations' && (
            <div className="space-y-4">
              {violations && violations.length > 0 ? (
                violations.map((violation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleViolation(index)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getImpactColor(violation.impact)}`}>
                          {violation.impact}
                        </span>
                        <span className="font-medium text-gray-900">{violation.id}</span>
                        <span className="text-sm text-gray-500">
                          ({violation.nodes?.length || 0} elements)
                        </span>
                      </div>
                      {expandedViolations[index] ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {expandedViolations[index] && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="mt-3 space-y-3">
                          <div>
                            <h4 className="font-medium text-gray-900">Description</h4>
                            <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                          </div>

                          {violation.help && (
                            <div>
                              <h4 className="font-medium text-gray-900">How to Fix</h4>
                              <p className="text-sm text-gray-600 mt-1">{violation.help}</p>
                            </div>
                          )}

                          {violation.helpUrl && (
                            <div>
                              <a
                                href={violation.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-500"
                              >
                                Learn more →
                              </a>
                            </div>
                          )}

                          {violation.nodes && violation.nodes.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Affected Elements</h4>
                              <div className="space-y-2">
                                {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                                  <div key={nodeIndex} className="bg-gray-50 rounded p-2">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs text-gray-800 break-all">
                                        {node.target?.[0] || node.html?.substring(0, 100) + '...'}
                                      </code>
                                      <button
                                        onClick={() => copyToClipboard(node.target?.[0] || node.html)}
                                        className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                        title="Copy selector"
                                      >
                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {violation.nodes.length > 3 && (
                                  <p className="text-xs text-gray-500">
                                    And {violation.nodes.length - 3} more elements...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* AI Fix Section */}
                          <div className="pt-4 border-t border-gray-100">
                            {!aiFixResults[index] && !loadingAIFix[index] && (
                              <button
                                onClick={() => handleAIFix(violation, index)}
                                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
                              >
                                <SparklesIcon className="h-4 w-4" />
                                <span>Fix with AI</span>
                              </button>
                            )}

                            {loadingAIFix[index] && (
                              <div className="flex items-center space-x-2 text-purple-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                <span className="text-sm">Generating AI fix...</span>
                              </div>
                            )}

                            {aiFixResults[index] && !aiFixResults[index].error && (
                              <AIFixDisplay
                                aiFix={aiFixResults[index]}
                                onClose={() => setAiFixResults(prev => ({ ...prev, [index]: null }))}
                              />
                            )}

                            {aiFixResults[index]?.error && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                  <span className="text-sm text-red-700">{renderMessageWithGithubLink(aiFixResults[index].message)}</span>
                                </div>
                                <button
                                  onClick={() => setAiFixResults(prev => ({ ...prev, [index]: null }))}
                                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                                >
                                  Try again
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Violations Found!</h3>
                  <p className="text-gray-600">Great job! Your website passed all accessibility checks.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'passes' && (
            <div className="space-y-3">
              {passes && passes.length > 0 ? (
                passes.map((pass, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">{pass.id}</p>
                      <p className="text-sm text-green-700">{pass.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No passing tests recorded.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'incomplete' && (
            <div className="space-y-3">
              {incomplete && incomplete.length > 0 ? (
                incomplete.map((incompleteItem, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-900">{incompleteItem.id}</p>
                      <p className="text-sm text-yellow-700">{incompleteItem.description}</p>
                      <p className="text-xs text-yellow-600 mt-1">Manual review required</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">All tests completed successfully.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Analysis Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">URL:</dt>
                      <dd className="text-gray-900 break-all">{analysis?.url}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Analyzed:</dt>
                      <dd className="text-gray-900">{new Date(result.createdAt || analysis?.createdAt).toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">WCAG Level:</dt>
                      <dd className="text-gray-900">{analysis?.settings?.wcagLevel || 'AA'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Scan Duration:</dt>
                      <dd className="text-gray-900">{formatDuration(result.scanDuration)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Compliance Breakdown</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall Score</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getComplianceColor(complianceScore)}`}>
                        {Math.round(complianceScore)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          complianceScore >= 90 ? 'bg-green-500' :
                          complianceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${complianceScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Key Recommendations</h4>
                  <ul className="space-y-2">
                    {result.recommendations.slice(0, 5).map((rec, index) => (
                      <li key={index} className="text-sm text-blue-800 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
