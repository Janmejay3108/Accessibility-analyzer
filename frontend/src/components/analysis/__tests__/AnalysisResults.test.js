import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AnalysisResults from '../AnalysisResults';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('AnalysisResults', () => {
  const mockAnalysis = {
    id: 'test-analysis-id',
    url: 'https://example.com',
    createdAt: '2024-01-01T00:00:00Z',
    settings: {
      wcagLevel: 'AA'
    }
  };

  const mockResult = {
    complianceScore: 85,
    violations: [
      {
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure all text elements have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        nodes: [
          {
            target: ['.text-gray-400'],
            html: '<span class="text-gray-400">Low contrast text</span>'
          }
        ]
      },
      {
        id: 'missing-alt',
        impact: 'critical',
        description: 'Images must have alternate text',
        help: 'Add alt attributes to all images',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
        nodes: [
          {
            target: ['img[src="logo.png"]'],
            html: '<img src="logo.png">'
          }
        ]
      }
    ],
    passes: [
      {
        id: 'document-title',
        description: 'Documents must have a title'
      }
    ],
    incomplete: [
      {
        id: 'color-contrast-enhanced',
        description: 'Enhanced color contrast check requires manual review'
      }
    ],
    recommendations: [
      'Fix color contrast issues',
      'Add alt text to images',
      'Improve keyboard navigation'
    ],
    createdAt: '2024-01-01T00:00:00Z',
    scanDuration: 15000
  };

  test('renders summary cards correctly', () => {
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Violations count
    expect(screen.getByText('1')).toBeInTheDocument(); // Passes count
    expect(screen.getByText('1')).toBeInTheDocument(); // Incomplete count
  });

  test('displays violations tab by default', () => {
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    expect(screen.getByText('color-contrast')).toBeInTheDocument();
    expect(screen.getByText('missing-alt')).toBeInTheDocument();
    expect(screen.getByText('serious')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  test('expands violation details when clicked', async () => {
    const user = userEvent.setup();
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    const violationButton = screen.getByText('color-contrast').closest('button');
    await user.click(violationButton);
    
    expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
    expect(screen.getByText('Ensure all text elements have sufficient color contrast')).toBeInTheDocument();
    expect(screen.getByText('Learn more →')).toBeInTheDocument();
  });

  test('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    // Switch to passes tab
    const passesTab = screen.getByRole('button', { name: /passes/i });
    await user.click(passesTab);
    
    expect(screen.getByText('document-title')).toBeInTheDocument();
    expect(screen.getByText('Documents must have a title')).toBeInTheDocument();
    
    // Switch to incomplete tab
    const incompleteTab = screen.getByRole('button', { name: /incomplete/i });
    await user.click(incompleteTab);
    
    expect(screen.getByText('color-contrast-enhanced')).toBeInTheDocument();
    expect(screen.getByText('Manual review required')).toBeInTheDocument();
    
    // Switch to summary tab
    const summaryTab = screen.getByRole('button', { name: /summary/i });
    await user.click(summaryTab);
    
    expect(screen.getByText('Analysis Details')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('15s')).toBeInTheDocument(); // Scan duration
  });

  test('displays recommendations in summary tab', async () => {
    const user = userEvent.setup();
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    const summaryTab = screen.getByRole('button', { name: /summary/i });
    await user.click(summaryTab);
    
    expect(screen.getByText('Key Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Fix color contrast issues')).toBeInTheDocument();
    expect(screen.getByText('Add alt text to images')).toBeInTheDocument();
    expect(screen.getByText('Improve keyboard navigation')).toBeInTheDocument();
  });

  test('copies CSS selector to clipboard', async () => {
    const user = userEvent.setup();
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    // Expand first violation
    const violationButton = screen.getByText('color-contrast').closest('button');
    await user.click(violationButton);
    
    // Click copy button
    const copyButton = screen.getByTitle('Copy selector');
    await user.click(copyButton);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('.text-gray-400');
  });

  test('shows correct impact colors', () => {
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    const seriousImpact = screen.getByText('serious');
    const criticalImpact = screen.getByText('critical');
    
    expect(seriousImpact).toHaveClass('text-orange-800', 'bg-orange-100');
    expect(criticalImpact).toHaveClass('text-red-800', 'bg-red-100');
  });

  test('shows compliance score color based on value', () => {
    const highScoreResult = { ...mockResult, complianceScore: 95 };
    const { rerender } = render(<AnalysisResults result={highScoreResult} analysis={mockAnalysis} />);
    
    let scoreElement = screen.getAllByText('95%')[0];
    expect(scoreElement.parentElement).toHaveClass('text-green-800', 'bg-green-100');
    
    const mediumScoreResult = { ...mockResult, complianceScore: 75 };
    rerender(<AnalysisResults result={mediumScoreResult} analysis={mockAnalysis} />);
    
    scoreElement = screen.getAllByText('75%')[0];
    expect(scoreElement.parentElement).toHaveClass('text-yellow-800', 'bg-yellow-100');
    
    const lowScoreResult = { ...mockResult, complianceScore: 45 };
    rerender(<AnalysisResults result={lowScoreResult} analysis={mockAnalysis} />);
    
    scoreElement = screen.getAllByText('45%')[0];
    expect(scoreElement.parentElement).toHaveClass('text-red-800', 'bg-red-100');
  });

  test('handles empty results gracefully', () => {
    const emptyResult = {
      complianceScore: 100,
      violations: [],
      passes: [],
      incomplete: [],
      recommendations: []
    };
    
    render(<AnalysisResults result={emptyResult} analysis={mockAnalysis} />);
    
    expect(screen.getByText('No Violations Found!')).toBeInTheDocument();
    expect(screen.getByText('Great job! Your website passed all accessibility checks.')).toBeInTheDocument();
  });

  test('handles missing result prop', () => {
    render(<AnalysisResults result={null} analysis={mockAnalysis} />);
    
    expect(screen.getByText('No results available.')).toBeInTheDocument();
  });

  test('displays correct tab counts', () => {
    render(<AnalysisResults result={mockResult} analysis={mockAnalysis} />);
    
    const violationsTab = screen.getByRole('button', { name: /violations/i });
    const passesTab = screen.getByRole('button', { name: /passes/i });
    const incompleteTab = screen.getByRole('button', { name: /incomplete/i });
    
    expect(violationsTab).toHaveTextContent('2'); // 2 violations
    expect(passesTab).toHaveTextContent('1'); // 1 pass
    expect(incompleteTab).toHaveTextContent('1'); // 1 incomplete
  });

  test('limits displayed affected elements', async () => {
    const user = userEvent.setup();
    const resultWithManyNodes = {
      ...mockResult,
      violations: [
        {
          id: 'many-nodes',
          impact: 'minor',
          description: 'Test violation with many nodes',
          nodes: Array.from({ length: 5 }, (_, i) => ({
            target: [`.element-${i}`],
            html: `<div class="element-${i}">Element ${i}</div>`
          }))
        }
      ]
    };
    
    render(<AnalysisResults result={resultWithManyNodes} analysis={mockAnalysis} />);
    
    // Expand the violation
    const violationButton = screen.getByText('many-nodes').closest('button');
    await user.click(violationButton);
    
    // Should show only first 3 elements
    expect(screen.getByText('.element-0')).toBeInTheDocument();
    expect(screen.getByText('.element-1')).toBeInTheDocument();
    expect(screen.getByText('.element-2')).toBeInTheDocument();
    expect(screen.queryByText('.element-3')).not.toBeInTheDocument();
    expect(screen.getByText('And 2 more elements...')).toBeInTheDocument();
  });
});
