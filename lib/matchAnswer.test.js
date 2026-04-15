import { matchAnswer } from './matchAnswer.js';

describe('matchAnswer', () => {
  // ── Exact matches ──────────────────────────────────────────────────────────

  test('"greg inglis" matches "Greg Inglis" (exact full name, case-insensitive)', () => {
    const result = matchAnswer('greg inglis', 'Greg Inglis');
    expect(result.matched).toBe(true);
    expect(result.method).toBe('exact_full_name');
  });

  test('"Greg Inglis" matches "Greg Inglis" (exact full name)', () => {
    const result = matchAnswer('Greg Inglis', 'Greg Inglis');
    expect(result.matched).toBe(true);
    expect(result.method).toBe('exact_full_name');
  });

  // ── Last-name matches ──────────────────────────────────────────────────────

  test('"inglis" matches "Greg Inglis" (last name only)', () => {
    const result = matchAnswer('inglis', 'Greg Inglis');
    expect(result.matched).toBe(true);
    expect(result.method).toBe('exact_last_name');
  });

  test('"cleary" matches "Nathan Cleary" (last name only)', () => {
    const result = matchAnswer('cleary', 'Nathan Cleary');
    expect(result.matched).toBe(true);
    expect(result.method).toBe('exact_last_name');
  });

  test('"smith" matches "Cameron Smith" (last name only)', () => {
    const result = matchAnswer('smith', 'Cameron Smith');
    expect(result.matched).toBe(true);
    expect(result.method).toBe('exact_last_name');
  });

  // ── Typo / fuzzy matches ───────────────────────────────────────────────────

  test('"ingliss" matches "Greg Inglis" (1-char typo on last name)', () => {
    const result = matchAnswer('ingliss', 'Greg Inglis');
    expect(result.matched).toBe(true);
    expect(result.method).toBe('fuzzy_last_name');
  });

  test('"nathan cleary" matches "Nathan Cleary" (exact full name)', () => {
    const result = matchAnswer('nathan cleary', 'Nathan Cleary');
    expect(result.matched).toBe(true);
    expect(result.method).toBe('exact_full_name');
  });

  // ── Hyphenated name matches ────────────────────────────────────────────────

  test('"fonua-blake" matches "Addin Fonua-Blake" (hyphenated last name)', () => {
    const result = matchAnswer('fonua-blake', 'Addin Fonua-Blake');
    expect(result.matched).toBe(true);
  });

  test('"fonua blake" matches "Addin Fonua-Blake" (space instead of hyphen)', () => {
    const result = matchAnswer('fonua blake', 'Addin Fonua-Blake');
    expect(result.matched).toBe(true);
  });

  // ── Non-matches ────────────────────────────────────────────────────────────

  test('"greg jackson" does NOT match "Greg Inglis"', () => {
    const result = matchAnswer('greg jackson', 'Greg Inglis');
    expect(result.matched).toBe(false);
  });

  test('"greg" does NOT match "Greg Inglis" (first name only)', () => {
    const result = matchAnswer('greg', 'Greg Inglis');
    expect(result.matched).toBe(false);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  test('extra whitespace in guess is normalised', () => {
    const result = matchAnswer('  Greg   Inglis  ', 'Greg Inglis');
    expect(result.matched).toBe(true);
  });

  test('empty guess does not match', () => {
    const result = matchAnswer('', 'Greg Inglis');
    expect(result.matched).toBe(false);
  });
});
