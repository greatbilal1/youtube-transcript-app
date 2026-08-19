import { describe, expect, it } from 'vitest';
import { parseKnowledgeTree } from '../src/lib/llm/knowledgeMapParser';

describe('parseKnowledgeTree', () => {
  it('parses a valid JSON knowledge tree', () => {
    const raw = JSON.stringify({
      title: 'AI',
      type: 'central-theme',
      children: [
        { title: 'ML', type: 'theme', children: [{ title: 'Supervised', type: 'concept' }] },
      ],
    });
    const tree = parseKnowledgeTree(raw);
    expect(tree.title).toBe('AI');
    expect(tree.type).toBe('central-theme');
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].children[0].title).toBe('Supervised');
  });

  it('assigns ids, parentIds, and expanded state to every node', () => {
    const raw = JSON.stringify({
      title: 'AI',
      type: 'central-theme',
      children: [{ title: 'ML', type: 'theme' }],
    });
    const tree = parseKnowledgeTree(raw);
    expect(tree.id).toBeTruthy();
    expect(tree.parentId).toBeNull();
    expect(tree.expanded).toBe(true);
    expect(tree.children[0].id).toBeTruthy();
    expect(tree.children[0].parentId).toBe(tree.id);
    expect(tree.children[0].expanded).toBe(true);
  });

  it('salvages JSON wrapped in markdown fences', () => {
    const raw = '```json\n' + JSON.stringify({ title: 'AI', type: 'central-theme', children: [] }) + '\n```';
    const tree = parseKnowledgeTree(raw);
    expect(tree.title).toBe('AI');
  });

  it('salvages JSON embedded in prose', () => {
    const raw = 'Here is the map: ' + JSON.stringify({ title: 'AI', type: 'central-theme', children: [] }) + ' Hope that helps!';
    const tree = parseKnowledgeTree(raw);
    expect(tree.title).toBe('AI');
  });

  it('sanitizes invalid node types to a fallback', () => {
    const raw = JSON.stringify({
      title: 'AI',
      type: 'central-theme',
      children: [{ title: 'ML', type: 'not-a-real-type' }],
    });
    const tree = parseKnowledgeTree(raw);
    expect(tree.children[0].type).toBe('theme'); // depth 1 fallback
  });

  it('caps overly long titles', () => {
    const raw = JSON.stringify({
      title: 'x'.repeat(500),
      type: 'central-theme',
      children: [],
    });
    const tree = parseKnowledgeTree(raw);
    expect(tree.title.length).toBe(120);
  });

  it('accepts a single child object instead of an array', () => {
    const raw = JSON.stringify({
      title: 'AI',
      type: 'central-theme',
      children: { title: 'ML', type: 'theme' },
    });
    const tree = parseKnowledgeTree(raw);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].title).toBe('ML');
  });

  it('throws a descriptive error on non-JSON input', () => {
    expect(() => parseKnowledgeTree('this is not json at all')).toThrow(/JSON/);
  });

  it('throws on empty/invalid structure', () => {
    expect(() => parseKnowledgeTree('null')).toThrow(/invalid knowledge map/);
  });
});
