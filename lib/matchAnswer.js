/**
 * Calculates the Levenshtein edit distance between two strings.
 */
function levenshtein(a, b) {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  const matrix = [];

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = 1 + Math.min(
          matrix[i - 1][j],     // deletion
          matrix[i][j - 1],     // insertion
          matrix[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

/**
 * Returns the max allowed edit distance for a given string length.
 */
function editDistanceThreshold(str) {
  return str.length >= 8 ? 2 : 1;
}

/**
 * Trims, lowercases, collapses internal whitespace.
 */
function cleanName(str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Normalises hyphens to spaces so "fonua-blake" and "fonua blake" are equivalent.
 */
function normaliseHyphens(str) {
  return str.replace(/-/g, ' ');
}

/**
 * Returns the last word of a space-separated name.
 */
function extractLastName(name) {
  const parts = name.split(' ');
  return parts[parts.length - 1];
}

/**
 * Checks whether a guess matches a correct answer according to the FootyIQ rules.
 *
 * @param {string} guess   - The player's raw input
 * @param {string} answer  - The correct player name from the database
 * @returns {{ matched: boolean, method: string }}
 */
export function matchAnswer(guess, answer) {
  const cleanedGuess = cleanName(guess);
  const cleanedAnswer = cleanName(answer);

  const normalisedGuess = normaliseHyphens(cleanedGuess);
  const normalisedAnswer = normaliseHyphens(cleanedAnswer);

  // Split the *original* cleaned answer on spaces so "Addin Fonua-Blake" →
  // ["addin", "fonua-blake"], keeping the hyphenated surname as one token.
  const answerPartsOriginal = cleanedAnswer.split(' ');
  const isMultiWordAnswer = answerPartsOriginal.length > 1;

  // First name: normalise hyphens in case the first name itself is hyphenated.
  const answerFirstName = normaliseHyphens(answerPartsOriginal[0]);

  // Last name: take the final space-separated token of the original, then
  // normalise hyphens so "fonua-blake" becomes "fonua blake" for comparison.
  const answerLastNameRaw = answerPartsOriginal[answerPartsOriginal.length - 1];
  const answerLastName = normaliseHyphens(answerLastNameRaw);

  // Guard: never match on first name alone.
  // Reject if the guess exactly matches the first name of a multi-word answer.
  if (isMultiWordAnswer && normalisedGuess === answerFirstName) {
    return { matched: false, method: 'no_match' };
  }

  // 1. Exact full-name match (after hyphen normalisation)
  if (normalisedGuess === normalisedAnswer) {
    return { matched: true, method: 'exact_full_name' };
  }

  // 2. Exact last-name match
  if (normalisedGuess === answerLastName) {
    return { matched: true, method: 'exact_last_name' };
  }

  // 3. Fuzzy full-name match
  const fullNameThreshold = editDistanceThreshold(normalisedAnswer);
  if (levenshtein(normalisedGuess, normalisedAnswer) <= fullNameThreshold) {
    return { matched: true, method: 'fuzzy_full_name' };
  }

  // 4. Fuzzy last-name match
  const lastNameThreshold = editDistanceThreshold(answerLastName);
  if (levenshtein(normalisedGuess, answerLastName) <= lastNameThreshold) {
    return { matched: true, method: 'fuzzy_last_name' };
  }

  return { matched: false, method: 'no_match' };
}
