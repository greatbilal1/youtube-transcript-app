import type { KnowledgeNode, KnowledgeNodeType, KnowledgeTree } from '../../types/knowledgeMap';

/** All valid semantic node types. */
const VALID_TYPES = new Set<KnowledgeNodeType>([
  'central-theme', 'theme', 'concept', 'definition', 'principle', 'theory',
  'model', 'component', 'process', 'step', 'example', 'application',
  'use-case', 'position', 'argument', 'counterargument', 'criticism',
  'dilemma', 'question', 'core-question', 'concern', 'value',
  'ethical-question', 'cause', 'effect', 'benefit', 'risk', 'challenge',
  'limitation', 'evidence', 'consequence', 'implication', 'comparison',
  'difference', 'similarity', 'historical-event', 'historical-narrative',
  'counter-narrative', 'stakeholder', 'motivation', 'assumption',
  'political-pressure', 'public-opinion', 'case-study', 'future-direction',
  'open-question', 'source-content', 'concept-explanation', 'cross-cutting',
  'conflict', 'key-questions', 'insight', 'takeaway', 'framework',
  'relationship',
]);

const VALID_CONTENT_SOURCES = new Set(['source', 'explanation', 'inference']);

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `kn-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeTitle(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const t = value.trim();
  if (!t) return fallback;
  // Cap length to keep nodes scannable.
  return t.length > 120 ? t.slice(0, 120) : t;
}

function sanitizeType(value: unknown, fallback: KnowledgeNodeType): KnowledgeNodeType {
  if (typeof value === 'string' && VALID_TYPES.has(value as KnowledgeNodeType)) {
    return value as KnowledgeNodeType;
  }
  return fallback;
}

function sanitizeContentSource(value: unknown): 'source' | 'explanation' | 'inference' | undefined {
  if (typeof value === 'string' && VALID_CONTENT_SOURCES.has(value)) {
    return value as 'source' | 'explanation' | 'inference';
  }
  return undefined;
}

function sanitizeContent(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const c = value.trim();
  if (!c) return undefined;
  return c.length > 500 ? c.slice(0, 500) : c;
}

function sanitizePerspective(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const p = value.trim();
  return p ? p.slice(0, 60) : undefined;
}

function sanitizeConfidence(value: unknown): number | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return Math.max(0, Math.min(1, value));
}

/**
 * Recursively validate and normalize a raw (untrusted) node from the LLM.
 * Drops invalid children, sanitizes fields, and assigns stable ids.
 */
function sanitizeNode(raw: unknown, parentId: string | null, depth: number): KnowledgeNode | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const obj = raw as Record<string, unknown>;
  const title = sanitizeTitle(obj.title, 'Untitled');
  const type = sanitizeType(obj.type, depth === 0 ? 'central-theme' : depth === 1 ? 'theme' : 'concept');

  const node: KnowledgeNode = {
    id: nextId(),
    parentId,
    title,
    type,
    children: [],
    expanded: true,
    content: sanitizeContent(obj.content),
    contentSource: sanitizeContentSource(obj.contentSource),
    perspective: sanitizePerspective(obj.perspective),
    confidence: sanitizeConfidence(obj.confidence),
  };

  // Children may be an array, a single object, or missing.
  let rawChildren: unknown[] = [];
  if (Array.isArray(obj.children)) {
    rawChildren = obj.children;
  } else if (typeof obj.children === 'object' && obj.children !== null) {
    rawChildren = [obj.children];
  }

  for (const rc of rawChildren) {
    const child = sanitizeNode(rc, node.id, depth + 1);
    if (child) node.children.push(child);
  }

  return node;
}

/**
 * Parse and validate the LLM's JSON response into a KnowledgeTree.
 * Throws a descriptive error if the response cannot be parsed at all.
 */
export function parseKnowledgeTree(raw: string): KnowledgeTree {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    // Try to salvage JSON from a response wrapped in markdown fences or prose.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('The model did not return valid JSON for the knowledge map.');
    }
    try {
      data = JSON.parse(match[0]);
    } catch {
      throw new Error('The model returned malformed JSON for the knowledge map.');
    }
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('The model returned an invalid knowledge map structure.');
  }

  const obj = data as Record<string, unknown>;
  const root = sanitizeNode(obj, null, 0);
  if (!root) {
    throw new Error('The model returned an empty knowledge map.');
  }

  // Ensure the root is a central theme.
  root.type = 'central-theme';
  root.expanded = true;

  return root as KnowledgeTree;
}
