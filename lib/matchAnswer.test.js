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

  // ── Nickname / formal-name equivalence ─────────────────────────────────────

  test('"Matthew Bowen" matches "Matt Bowen" (formal → nickname answer)', () => {
    const result = matchAnswer('Matthew Bowen', 'Matt Bowen');
    expect(result.matched).toBe(true);
  });

  test('"Matt Bowen" matches "Matthew Bowen" (nickname → formal answer)', () => {
    const result = matchAnswer('Matt Bowen', 'Matthew Bowen');
    expect(result.matched).toBe(true);
  });

  test('"Willie Mason" matches "Willie Mason" (exact, with nickname in DB)', () => {
    const result = matchAnswer('Willie Mason', 'Willie Mason');
    expect(result.matched).toBe(true);
  });

  test('"William Mason" matches "Willie Mason" (formal → nickname answer)', () => {
    const result = matchAnswer('William Mason', 'Willie Mason');
    expect(result.matched).toBe(true);
  });

  test('"Matt" does NOT match "Matt Bowen" (first name only)', () => {
    const result = matchAnswer('Matt', 'Matt Bowen');
    expect(result.matched).toBe(false);
  });

  test('"Matthew" does NOT match "Matthew Bowen" (first name only)', () => {
    const result = matchAnswer('Matthew', 'Matthew Bowen');
    expect(result.matched).toBe(false);
  });

  test('"JT Thurston" matches "Johnathan Thurston"', () => {
    const result = matchAnswer('JT Thurston', 'Johnathan Thurston');
    expect(result.matched).toBe(true);
  });

  test('"Jonathan Thurston" matches "Johnathan Thurston" (spelling variants)', () => {
    const result = matchAnswer('Jonathan Thurston', 'Johnathan Thurston');
    expect(result.matched).toBe(true);
  });

  test('"Cam Smith" matches "Cameron Smith"', () => {
    const result = matchAnswer('Cam Smith', 'Cameron Smith');
    expect(result.matched).toBe(true);
  });

  test('"Benji Marshall" matches "Benjamin Marshall"', () => {
    const result = matchAnswer('Benji Marshall', 'Benjamin Marshall');
    expect(result.matched).toBe(true);
  });

  test('"Steve Rogers" matches "Stephen Rogers"', () => {
    const result = matchAnswer('Steve Rogers', 'Stephen Rogers');
    expect(result.matched).toBe(true);
  });
});
