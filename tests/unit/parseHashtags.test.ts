import { describe, it, expect } from 'vitest';
import { parseHashtags } from '../../src/lib/parseHashtags';

describe('parseHashtags', () => {
  it('adds # prefix and keeps existing ones', () => {
    expect(parseHashtags('food #travel weekend')).toEqual(['#food', '#travel', '#weekend']);
  });

  it('returns empty array for empty or whitespace input', () => {
    expect(parseHashtags('')).toEqual([]);
    expect(parseHashtags('   ')).toEqual([]);
  });

  it('collapses repeated whitespace and tabs', () => {
    expect(parseHashtags('  a   b\tc ')).toEqual(['#a', '#b', '#c']);
  });

  it('drops a lone # while the user is still typing', () => {
    expect(parseHashtags('#food #')).toEqual(['#food']);
  });
});

