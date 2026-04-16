/**
 * Maps known nicknames/short forms to their canonical (formal) lowercase equivalent.
 * Both the guess and the answer have their first name normalised through this map
 * before comparison, so e.g. "Matt Bowen" and "Matthew Bowen" resolve to the same string.
 */
const NICKNAME_MAP = {
  // Matthew
  matt: 'matthew',
  // Nicholas
  nick: 'nicholas',
  nicky: 'nicholas',
  // Michael
  mike: 'michael',
  mick: 'michael',
  // Christopher
  chris: 'christopher',
  // Robert
  rob: 'robert',
  robbie: 'robert',
  // William
  will: 'william',
  willie: 'william',
  billy: 'william',
  // Samuel
  sam: 'samuel',
  // Thomas
  tom: 'thomas',
  tommy: 'thomas',
  // Timothy
  tim: 'timothy',
  // Jonathan (also covers Johnathan spelling)
  johnno: 'jonathan',
  jt: 'jonathan',         // special case for Thurston
  johnathan: 'jonathan',  // alternate spelling
  // Cameron
  cam: 'cameron',
  // Gregory
  greg: 'gregory',
  // Richard
  ricky: 'richard',
  rick: 'richard',
  // Steven (covers Stephen)
  steve: 'steven',
  stevie: 'steven',
  stephen: 'steven',
  // Benjamin
  benji: 'benjamin',
  benny: 'benjamin',
  // David
  dave: 'david',
  davey: 'david',
};

/**
 * Replaces the first word of a name with its canonical form if it appears in
 * NICKNAME_MAP.  Only the first name is touched; surnames are left unchanged.
 * Works on the already-hyphen-normalised, lowercased string.
 *
 * e.g. "matt bowen" → "matthew bowen"
 *      "jt thurston" → "jonathan thurston"
 *      "fonua blake"  → "fonua blake"  (no mapping for "fonua")
 */
function normaliseFirstName(name) {
  const spaceIdx = name.indexOf(' ');
  if (spaceIdx === -1) {
    // Single word — normalise it (used in guard check)
    return NICKNAME_MAP[name] ?? name;
  }
  const first = name.slice(0, spaceIdx);
  const rest = name.slice(spaceIdx); // includes the leading space
  return (NICKNAME_MAP[first] ?? first) + rest;
}

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

  // Last name: take the final space-separated token of the original, then
  // normalise hyphens so "fonua-blake" becomes "fonua blake" for comparison.
  const answerLastNameRaw = answerPartsOriginal[answerPartsOriginal.length - 1];
  const answerLastName = normaliseHyphens(answerLastNameRaw);

  // Nickname-normalise the first names of both guess and answer so that e.g.
  // "Matt Bowen" and "Matthew Bowen" collapse to the same string before any
  // comparison.  Only the first word is touched; surnames are unchanged.
  const nickNormGuess = normaliseFirstName(normalisedGuess);
  const nickNormAnswer = normaliseFirstName(normalisedAnswer);

  // First name for guard check: first word of the nickname-normalised answer.
  const nickNormAnswerFirstName = nickNormAnswer.split(' ')[0];

  // Guard: never match on first name alone.
  // Reject if the guess (after nickname normalisation) exactly equals the first
  // name of the answer (also after normalisation).
  if (isMultiWordAnswer && nickNormGuess === nickNormAnswerFirstName) {
    return { matched: false, method: 'no_match' };
  }

  // 1. Exact full-name match (after hyphen + nickname normalisation)
  if (nickNormGuess === nickNormAnswer) {
    return { matched: true, method: 'exact_full_name' };
  }

  // 2. Exact last-name match (surnames don't use the nickname map)
  if (normalisedGuess === answerLastName) {
    return { matched: true, method: 'exact_last_name' };
  }

  // 3. Fuzzy full-name match (on nickname-normalised forms)
  const fullNameThreshold = editDistanceThreshold(nickNormAnswer);
  if (levenshtein(nickNormGuess, nickNormAnswer) <= fullNameThreshold) {
    return { matched: true, method: 'fuzzy_full_name' };
  }

  // 4. Fuzzy last-name match
  const lastNameThreshold = editDistanceThreshold(answerLastName);
  if (levenshtein(normalisedGuess, answerLastName) <= lastNameThreshold) {
    return { matched: true, method: 'fuzzy_last_name' };
  }

  return { matched: false, method: 'no_match' };
}
