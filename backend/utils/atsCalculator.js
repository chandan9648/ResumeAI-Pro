/**
 * ATS Score Calculator
 * Computes a 0–100 ATS compatibility score based on weighted factors.
 *
 * Weights:
 *   Keyword Match      → 35%
 *   Skill Match        → 25%
 *   Section Completeness → 20%
 *   Formatting         → 10%
 *   Readability        → 10%
 */

/**
 * Normalize text for comparison
 */
const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Count keyword occurrences in resume text
 */
const countKeywordMatches = (resumeText, keywords) => {
  if (!keywords || keywords.length === 0) return 0;
  const normalized = normalize(resumeText);
  let matched = 0;
  for (const kw of keywords) {
    if (normalized.includes(normalize(kw))) matched++;
  }
  return matched / keywords.length;
};

/**
 * Calculate skill match ratio
 */
const calcSkillMatch = (resumeSkills, jdSkills) => {
  if (!jdSkills || jdSkills.length === 0) return 1;
  const normalized = resumeSkills.map((s) => normalize(s));
  let matched = 0;
  for (const skill of jdSkills) {
    if (normalized.some((rs) => rs.includes(normalize(skill)))) matched++;
  }
  return matched / jdSkills.length;
};

/**
 * Calculate section completeness score
 */
const calcSectionCompleteness = (parsedSections) => {
  const checks = [
    parsedSections.name && parsedSections.name.length > 0,
    parsedSections.email && parsedSections.email.length > 0,
    parsedSections.phone && parsedSections.phone.length > 0,
    parsedSections.summary && parsedSections.summary.length > 50,
    parsedSections.skills && parsedSections.skills.length >= 3,
    parsedSections.experience && parsedSections.experience.length >= 1,
    parsedSections.education && parsedSections.education.length >= 1,
  ];
  const passed = checks.filter(Boolean).length;
  return passed / checks.length;
};

/**
 * Calculate formatting quality (heuristic checks on raw text)
 */
const calcFormatting = (resumeText) => {
  let score = 0;
  const lines = resumeText.split('\n').filter((l) => l.trim());

  // Not too short, not a wall of text
  if (lines.length >= 20 && lines.length <= 100) score += 0.3;

  // Contains common section headers
  const headers = ['experience', 'education', 'skills', 'summary', 'projects'];
  const hasHeaders = headers.filter((h) => normalize(resumeText).includes(h)).length;
  score += (hasHeaders / headers.length) * 0.4;

  // No tables or graphics heuristic (no pipe chars in bulk)
  const pipeCount = (resumeText.match(/\|/g) || []).length;
  if (pipeCount < 5) score += 0.3;

  return Math.min(score, 1);
};

/**
 * Calculate readability (sentence length heuristic)
 */
const calcReadability = (resumeText) => {
  const sentences = resumeText
    .split(/[.!?]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length === 0) return 0.5;

  const avgWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;

  // Ideal average: 10–20 words per sentence
  if (avgWords >= 8 && avgWords <= 22) return 1;
  if (avgWords < 8) return 0.7;
  return 0.6;
};

/**
 * Main ATS score calculator
 * @param {object} parsedSections - Structured resume sections
 * @param {string} resumeText - Raw resume text
 * @param {object} jdData - Extracted JD data { skills, keywords }
 * @returns {{ total: number, breakdown: object, missingSkills: string[] }}
 */
const calculateATSScore = (parsedSections, resumeText, jdData = {}) => {
  const { keywords = [], required = [], preferred = [] } = jdData;
  const allJDSkills = [...new Set([...required, ...preferred])];

  const keywordScore = countKeywordMatches(resumeText, keywords);
  const skillScore = calcSkillMatch(parsedSections.skills || [], allJDSkills);
  const completenessScore = calcSectionCompleteness(parsedSections);
  const formattingScore = calcFormatting(resumeText);
  const readabilityScore = calcReadability(resumeText);

  const total = Math.round(
    keywordScore * 35 +
    skillScore * 25 +
    completenessScore * 20 +
    formattingScore * 10 +
    readabilityScore * 10
  );

  // Identify missing skills
  const normalizedResumeSkills = (parsedSections.skills || []).map(normalize);
  const missingSkills = allJDSkills.filter(
    (s) => !normalizedResumeSkills.some((rs) => rs.includes(normalize(s)))
  );

  return {
    total: Math.min(total, 100),
    breakdown: {
      keywordMatch: Math.round(keywordScore * 100),
      skillMatch: Math.round(skillScore * 100),
      sectionCompleteness: Math.round(completenessScore * 100),
      formatting: Math.round(formattingScore * 100),
      readability: Math.round(readabilityScore * 100),
    },
    missingSkills: missingSkills.slice(0, 10),
  };
};

module.exports = { calculateATSScore };
