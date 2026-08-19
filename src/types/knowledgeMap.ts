/**
 * Semantic knowledge-map data model.
 *
 * The hierarchy is SEMANTIC — it describes what the source means. Visual
 * coordinates are NEVER stored here; the layout engine derives them from the
 * hierarchy at render time. This keeps the two layers cleanly separated.
 */

/** Semantic role of a node. The LLM picks whichever fits naturally; the same
 *  type may appear at different hierarchy levels. */
export type KnowledgeNodeType =
  | 'central-theme'
  | 'theme'
  | 'concept'
  | 'definition'
  | 'principle'
  | 'theory'
  | 'model'
  | 'component'
  | 'process'
  | 'step'
  | 'example'
  | 'application'
  | 'use-case'
  | 'position'
  | 'argument'
  | 'counterargument'
  | 'criticism'
  | 'dilemma'
  | 'question'
  | 'core-question'
  | 'concern'
  | 'value'
  | 'ethical-question'
  | 'cause'
  | 'effect'
  | 'benefit'
  | 'risk'
  | 'challenge'
  | 'limitation'
  | 'evidence'
  | 'consequence'
  | 'implication'
  | 'comparison'
  | 'difference'
  | 'similarity'
  | 'historical-event'
  | 'historical-narrative'
  | 'counter-narrative'
  | 'stakeholder'
  | 'motivation'
  | 'assumption'
  | 'political-pressure'
  | 'public-opinion'
  | 'case-study'
  | 'future-direction'
  | 'open-question'
  | 'source-content'
  | 'concept-explanation'
  | 'cross-cutting'
  | 'conflict'
  | 'key-questions'
  | 'insight'
  | 'takeaway'
  | 'framework'
  | 'relationship';

/** Provenance of a node's content — distinguishes source vs model knowledge. */
export type ContentSource = 'source' | 'explanation' | 'inference';

/** A single knowledge-map node. */
export interface KnowledgeNode {
  id: string;
  parentId: string | null;
  title: string;
  type: KnowledgeNodeType;
  children: KnowledgeNode[];
  /** Whether this node's children are currently expanded. */
  expanded: boolean;
  /** Short supporting content (1–2 sentences). */
  content?: string;
  /** Provenance of `content`. */
  contentSource?: ContentSource;
  /** Optional perspective/author label (e.g. "Smith's Position"). */
  perspective?: string;
  /** Optional model confidence 0–1. */
  confidence?: number;
  /** Branch color (assigned by the renderer, not the LLM). */
  color?: string;
}

/** The validated knowledge tree returned by the LLM. The root is itself a
 *  node (the central theme), so it carries the same identity/expansion fields
 *  as every other node. */
export interface KnowledgeTree extends KnowledgeNode {
  title: string;
  type: KnowledgeNodeType;
  children: KnowledgeNode[];
}

/** A node with resolved layout geometry (computed by the layout engine). */
export interface LayoutNode extends KnowledgeNode {
  /** Depth in the tree (0 = central theme). */
  depth: number;
  /** Center x/y in canvas coordinates. */
  x: number;
  y: number;
  /** Node box size. */
  width: number;
  height: number;
  /** Radial sector this node's branch occupies (radians). */
  sectorStart: number;
  sectorEnd: number;
  /** Whether this node is currently visible (ancestors all expanded). */
  visible: boolean;
  /** Whether this node has any visible descendants. */
  hasVisibleChildren: boolean;
  /** Branch color resolved for this node. */
  color: string;
  /** Whether this node is a cross-cutting concept (visually distinct). */
  isCrossCutting: boolean;
}

/** A connector (curved path) between a parent and child node. */
export interface Connector {
  id: string;
  fromId: string;
  toId: string;
  /** SVG path `d` string. */
  d: string;
  color: string;
}

/** The full computed layout for a knowledge tree. */
export interface KnowledgeLayout {
  nodes: LayoutNode[];
  connectors: Connector[];
  /** Total canvas width/height. */
  width: number;
  height: number;
  /** Bounding box of all visible nodes (for fit-to-screen). */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}
