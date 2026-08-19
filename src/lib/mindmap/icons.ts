import type { KnowledgeNodeType } from '../../types/knowledgeMap';

/**
 * Map semantic node types to a short label + lucide icon name.
 * Icons are rendered as inline SVG paths to keep the renderer self-contained
 * and exportable (no external font dependencies).
 */

export interface TypeVisual {
  label: string;
  /** SVG path data (24x24 viewBox, stroke-based like lucide). */
  path: string;
}

/** Minimal stroke-based icon paths (24x24). */
const ICONS: Record<string, string> = {
  // concept / definition
  concept: 'M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7Z M9 22h6',
  definition: 'M4 6h16M4 12h16M4 18h10',
  principle: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3Z',
  theory: 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  model: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  component: 'M12 2l8 4v12l-8 4-8-4V6l8-4Z',
  process: 'M3 12h4l3-8 4 16 3-8h4',
  step: 'M12 2v20M2 12h20',
  example: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  application: 'M12 2l8 4v12l-8 4-8-4V6l8-4Z M12 22V2',
  'use-case': 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4m-6-6v6m0 0H9m6 0h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4m-6-6v6m0 0H5a2 2 0 0 1-2-2v-4m6 6h6',
  position: 'M12 2v20M4 6h16M6 6c0 4 6 4 6 8M18 6c0 4-6 4-6 8',
  argument: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z',
  counterargument: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z M9 9l6 6M15 9l-6 6',
  criticism: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  dilemma: 'M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 8v8M8 12h8',
  question: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17h.01',
  'core-question': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17h.01M12 3v3M12 18v3',
  concern: 'M12 3l9 16H3l9-16ZM12 10v4M12 17h.01',
  value: 'M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2Z',
  'ethical-question': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v4M12 16h.01',
  cause: 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  effect: 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  benefit: 'M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2ZM12 6v12',
  risk: 'M12 3l9 16H3l9-16ZM12 10v4M12 17h.01',
  challenge: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v4M12 16h.01',
  limitation: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 8l8 8',
  evidence: 'M9 3h6v4H9zM9 7v14M15 7v14M3 11h6M15 11h6',
  consequence: 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  implication: 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  comparison: 'M8 3v18M16 3v18M3 8h5M3 16h5M16 8h5M16 16h5',
  difference: 'M8 3v18M16 3v18M3 8h5M3 16h5M16 8h5M16 16h5',
  similarity: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v8M8 12h8',
  'historical-event': 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  'historical-narrative': 'M4 6h16M4 12h16M4 18h16',
  'counter-narrative': 'M4 6h16M4 12h16M4 18h16M9 3l-2 3M15 3l-2 3',
  stakeholder: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  motivation: 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  assumption: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v4M12 16h.01',
  'political-pressure': 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  'public-opinion': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 12h8M12 8v8',
  'case-study': 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4m-6-6v6m0 0H9m6 0h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4m-6-6v6m0 0H5a2 2 0 0 1-2-2v-4m6 6h6',
  'future-direction': 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  'open-question': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17h.01',
  'source-content': 'M4 6h16M4 12h16M4 18h16',
  'concept-explanation': 'M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7ZM9 22h6',
  'cross-cutting': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v8M8 12h8',
  conflict: 'M12 3v18M5 7l7 5 7-5M5 17l7-5 7 5',
  'key-questions': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4M12 17h.01',
  insight: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v4M12 16h.01',
  takeaway: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v4M12 16h.01',
  framework: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  relationship: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v8M8 12h8',
  'central-theme': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  theme: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
};

/** Default icon for unknown types. */
const DEFAULT_ICON = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z';

/** Short label for each type (used in tooltips / badges). */
const LABELS: Record<string, string> = {
  'central-theme': 'Theme',
  theme: 'Theme',
  concept: 'Concept',
  definition: 'Definition',
  principle: 'Principle',
  theory: 'Theory',
  model: 'Model',
  component: 'Component',
  process: 'Process',
  step: 'Step',
  example: 'Example',
  application: 'Application',
  'use-case': 'Use case',
  position: 'Position',
  argument: 'Argument',
  counterargument: 'Counterargument',
  criticism: 'Criticism',
  dilemma: 'Dilemma',
  question: 'Question',
  'core-question': 'Core question',
  concern: 'Concern',
  value: 'Value',
  'ethical-question': 'Ethical question',
  cause: 'Cause',
  effect: 'Effect',
  benefit: 'Benefit',
  risk: 'Risk',
  challenge: 'Challenge',
  limitation: 'Limitation',
  evidence: 'Evidence',
  consequence: 'Consequence',
  implication: 'Implication',
  comparison: 'Comparison',
  difference: 'Difference',
  similarity: 'Similarity',
  'historical-event': 'Event',
  'historical-narrative': 'Narrative',
  'counter-narrative': 'Counter-narrative',
  stakeholder: 'Stakeholder',
  motivation: 'Motivation',
  assumption: 'Assumption',
  'political-pressure': 'Pressure',
  'public-opinion': 'Opinion',
  'case-study': 'Case study',
  'future-direction': 'Future',
  'open-question': 'Open question',
  'source-content': 'Source',
  'concept-explanation': 'Explanation',
  'cross-cutting': 'Cross-cutting',
  conflict: 'Conflict',
  'key-questions': 'Key questions',
  insight: 'Insight',
  takeaway: 'Takeaway',
  framework: 'Framework',
  relationship: 'Relationship',
};

export function getTypeVisual(type: KnowledgeNodeType): TypeVisual {
  return {
    label: LABELS[type] ?? 'Concept',
    path: ICONS[type] ?? DEFAULT_ICON,
  };
}
