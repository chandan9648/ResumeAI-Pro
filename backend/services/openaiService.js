/**
 * OpenAI Service — Resume Optimization & JD Analysis
 *
 * If OPENAI_API_KEY is set, uses GPT-4o.
 * Otherwise falls back to intelligent mock responses for development.
 */

let openaiClient = null;

const initOpenAI = () => {
  if (!openaiClient && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-key-here') {
    try {
      const OpenAI = require('openai');
      openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      console.log('✅ OpenAI client initialized');
    } catch (e) {
      console.warn('⚠️  OpenAI not available, using mock responses');
    }
  }
  return openaiClient;
};

/**
 * Parse resume text into structured sections (heuristic fallback)
 */
const parseResumeTextHeuristic = (text) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const sections = {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  // Email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) sections.email = emailMatch[0];

  // Phone
  const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,15}\d)/);
  if (phoneMatch) sections.phone = phoneMatch[0].trim();

  // LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  if (linkedinMatch) sections.linkedin = linkedinMatch[0];

  // Name (first non-empty line before email/phone)
  for (const line of lines.slice(0, 5)) {
    if (!line.includes('@') && !/\d{5,}/.test(line) && line.length > 2 && line.length < 60) {
      sections.name = line;
      break;
    }
  }

  // Skills (look for Skills section)
  const skillsIdx = lines.findIndex((l) => /^skills?/i.test(l));
  if (skillsIdx !== -1) {
    const skillLines = [];
    for (let i = skillsIdx + 1; i < Math.min(skillsIdx + 8, lines.length); i++) {
      if (/^(experience|education|project|certif|summary|objective)/i.test(lines[i])) break;
      skillLines.push(lines[i]);
    }
    const rawSkills = skillLines.join(', ');
    sections.skills = rawSkills
      .split(/[,|•·]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40);
  }

  // Summary
  const summaryIdx = lines.findIndex((l) => /^(summary|objective|profile|about)/i.test(l));
  if (summaryIdx !== -1) {
    const summaryLines = [];
    for (let i = summaryIdx + 1; i < Math.min(summaryIdx + 6, lines.length); i++) {
      if (/^(experience|education|skills|project)/i.test(lines[i])) break;
      summaryLines.push(lines[i]);
    }
    sections.summary = summaryLines.join(' ');
  }

  // Experience (simplified)
  const expIdx = lines.findIndex((l) => /^(experience|work history|employment)/i.test(l));
  if (expIdx !== -1) {
    let current = null;
    for (let i = expIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^(education|skills|project|certif)/i.test(line)) break;
      if (line.length > 5 && line.length < 80 && !line.startsWith('•') && !line.startsWith('-')) {
        if (current) sections.experience.push(current);
        current = { company: line, title: '', duration: '', bullets: [] };
      } else if (current && (line.startsWith('•') || line.startsWith('-'))) {
        current.bullets.push(line.replace(/^[•\-]\s*/, ''));
      }
    }
    if (current) sections.experience.push(current);
  }

  // Education
  const eduIdx = lines.findIndex((l) => /^(education|academic)/i.test(l));
  if (eduIdx !== -1) {
    for (let i = eduIdx + 1; i < Math.min(eduIdx + 10, lines.length); i++) {
      const line = lines[i];
      if (/^(experience|skills|project|certif)/i.test(line)) break;
      if (line.length > 5) {
        sections.education.push({ institution: line, degree: '', year: '', gpa: '' });
        break;
      }
    }
  }

  return sections;
};

/**
 * Analyze Job Description — extract skills, keywords, responsibilities
 */
const analyzeJobDescription = async (jdText) => {
  const client = initOpenAI();

  if (client) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS and job description analyzer. 
Extract structured information from job descriptions and return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Analyze this job description and extract:
1. Required skills (hard skills)
2. Preferred skills  
3. Important keywords
4. Key responsibilities (bullet points)
5. Experience required

Return ONLY this JSON format:
{
  "jobTitle": "...",
  "required": ["skill1", "skill2"],
  "preferred": ["skill1", "skill2"],
  "keywords": ["kw1", "kw2"],
  "responsibilities": ["resp1", "resp2"],
  "experienceRequired": "X years"
}

Job Description:
${jdText}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI JD analyze error:', error.message);
    }
  }

  // === MOCK RESPONSE (development without API key) ===
  return generateMockJDAnalysis(jdText);
};

/**
 * Optimize resume sections based on JD
 */
const optimizeResume = async (resumeSections, jdText, missingSkills = []) => {
  const client = initOpenAI();

  if (client) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert ATS resume optimizer. Rewrite resume content to maximize ATS compatibility while keeping all information truthful. Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Optimize this resume for the job description below.

Tasks:
1. Rewrite experience bullets with strong action verbs and quantified results
2. Improve the professional summary to target this role
3. Add missing relevant skills naturally
4. Keep all information truthful — only enhance phrasing
5. Improve ATS keyword density

Return the SAME JSON structure as input but with optimized content.

Resume JSON:
${JSON.stringify(resumeSections, null, 2)}

Job Description:
${jdText}

Missing Skills to incorporate: ${missingSkills.join(', ')}

Return format: same keys as Resume JSON but with optimized values.`,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('OpenAI optimize error:', error.message);
    }
  }

  // === MOCK OPTIMIZATION ===
  return generateMockOptimization(resumeSections, missingSkills);
};

// ─── Mock Helpers ─────────────────────────────────────────────────────────────

const generateMockJDAnalysis = (jdText) => {
  const words = jdText.toLowerCase().split(/\s+/);
  const techSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'TypeScript', 'REST API', 'Agile'];
  const found = techSkills.filter((s) => jdText.toLowerCase().includes(s.toLowerCase()));
  const required = found.length > 0 ? found.slice(0, 5) : ['JavaScript', 'React', 'Node.js'];
  const preferred = found.length > 5 ? found.slice(5) : ['TypeScript', 'Docker', 'AWS'];

  return {
    jobTitle: extractJobTitle(jdText),
    required,
    preferred,
    keywords: [...required, 'team collaboration', 'problem-solving', 'agile methodology', 'version control'],
    responsibilities: [
      'Design, develop, and maintain scalable web applications',
      'Collaborate with cross-functional teams to define and implement new features',
      'Write clean, maintainable, and well-documented code',
      'Participate in code reviews and contribute to team standards',
      'Troubleshoot and resolve technical issues in production',
    ],
    experienceRequired: '2-5 years',
  };
};

const extractJobTitle = (jdText) => {
  const titlePatterns = [
    /(?:position|role|title)[:\s]+([A-Z][^\n.]{5,50})/i,
    /(?:hiring|looking for|seeking)[:\s]+(?:a\s+)?([A-Z][^\n.]{5,50})/i,
  ];
  for (const pat of titlePatterns) {
    const m = jdText.match(pat);
    if (m) return m[1].trim();
  }
  return 'Software Engineer';
};

const generateMockOptimization = (sections, missingSkills) => {
  const optimized = JSON.parse(JSON.stringify(sections)); // deep clone

  // Improve summary
  if (optimized.summary) {
    optimized.summary = `Results-driven ${sections.name ? sections.name.split(' ')[0] : 'professional'} with proven expertise in ${(sections.skills || []).slice(0, 3).join(', ')}. Passionate about building scalable solutions and delivering measurable business impact. ${optimized.summary}`;
  }

  // Improve experience bullets
  if (optimized.experience) {
    optimized.experience = optimized.experience.map((exp) => ({
      ...exp,
      bullets: (exp.bullets || []).map((bullet) => improveBullet(bullet)),
    }));
  }

  // Add missing skills
  if (missingSkills.length > 0 && optimized.skills) {
    optimized.skills = [...new Set([...optimized.skills, ...missingSkills.slice(0, 3)])];
  }

  return optimized;
};

const actionVerbs = ['Developed', 'Architected', 'Implemented', 'Optimized', 'Led', 'Designed', 'Delivered', 'Scaled', 'Automated', 'Streamlined'];

const improveBullet = (bullet) => {
  if (!bullet || bullet.length < 5) return bullet;

  // Capitalize weak starts
  const weakStarts = /^(worked on|did|made|helped|was responsible for|participated in)/i;
  if (weakStarts.test(bullet)) {
    const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    bullet = bullet.replace(weakStarts, verb);
  }

  // Add quantification hint if missing numbers
  if (!/\d+/.test(bullet) && bullet.length < 120) {
    const additions = [', improving efficiency by 30%', ', reducing processing time by 25%', ', resulting in 40% performance improvement'];
    bullet = bullet.replace(/\.$/, '') + additions[Math.floor(Math.random() * additions.length)] + '.';
  }

  return bullet.charAt(0).toUpperCase() + bullet.slice(1);
};

module.exports = {
  analyzeJobDescription,
  optimizeResume,
  parseResumeTextHeuristic,
};
