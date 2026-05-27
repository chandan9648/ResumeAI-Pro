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
  const phoneMatch = text.match(/(\+?[\d][\d\s\-().]{7,15}\d)/);
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

  // Location (city, state or city, country pattern)
  const locationMatch = text.match(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+)\b/);
  if (locationMatch && !locationMatch[0].includes('@')) {
    sections.location = locationMatch[0];
  }

  // Date/duration pattern helper
  const durationPattern = /((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4}\s*[-\u2013\u2014to]+\s*(Present|Current|Now|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{0,4}|\d{4}\s*[-\u2013\u2014to]+\s*(Present|Current|Now|\d{4}))/i;

  // Job title keywords
  const titleKeywords = /\b(engineer|developer|analyst|manager|director|lead|architect|designer|consultant|specialist|coordinator|administrator|officer|president|associate|senior|junior|intern|head|chief|executive|scientist|researcher|professor|teacher|instructor|programmer|technician)\b/i;

  // Skills (look for Skills section)
  const skillsIdx = lines.findIndex((l) => /^(technical\s+)?skills?(\s*[&:]\s*\w+)?$/i.test(l));
  if (skillsIdx !== -1) {
    const skillLines = [];
    for (let i = skillsIdx + 1; i < Math.min(skillsIdx + 10, lines.length); i++) {
      if (/^(experience|education|project|certif|summary|objective|work\s+history|employment)/i.test(lines[i])) break;
      skillLines.push(lines[i]);
    }
    const rawSkills = skillLines.join(', ');
    sections.skills = rawSkills
      .split(/[,|\u2022\u00b7\n]/)
      .map((s) => s.replace(/^[-\u2013]\s*/, '').trim())
      .filter((s) => s.length > 1 && s.length < 50);
  }

  // Summary
  const summaryIdx = lines.findIndex((l) => /^(summary|objective|profile|about\s*me|professional\s+summary)/i.test(l));
  if (summaryIdx !== -1) {
    const summaryLines = [];
    for (let i = summaryIdx + 1; i < Math.min(summaryIdx + 8, lines.length); i++) {
      if (/^(experience|education|skills|project|certif|work\s+history)/i.test(lines[i])) break;
      summaryLines.push(lines[i]);
    }
    sections.summary = summaryLines.join(' ').trim();
  }

  // Experience — improved multi-line parsing
  const expIdx = lines.findIndex((l) => /^(experience|work\s*(experience|history)|employment(\s+history)?|professional\s+experience)/i.test(l));
  if (expIdx !== -1) {
    let current = null;

    for (let i = expIdx + 1; i < lines.length; i++) {
      const line = lines[i];

      if (/^(education|skills|project|certif|awards|publications|references|volunteer|languages|interests|hobbies)/i.test(line)) break;

      const isBullet = line.startsWith('\u2022') || line.startsWith('\u2013') || line.startsWith('-') || line.startsWith('*') || /^\d+\.\s/.test(line);
      const isDuration = durationPattern.test(line);
      const isTitle = titleKeywords.test(line) && line.length < 80 && !isBullet;

      if (isBullet) {
        if (current) {
          current.bullets.push(line.replace(/^[\u2022\u2013\-*]\s*|\d+\.\s/, '').trim());
        }
      } else if (isDuration) {
        if (current) current.duration = line.trim();
      } else if (isTitle && current && !current.title) {
        current.title = line.trim();
      } else if (!isBullet && line.length > 3 && line.length < 100) {
        if (current) sections.experience.push(current);
        if (isTitle) {
          current = { title: line.trim(), company: '', duration: '', bullets: [] };
        } else {
          current = { company: line.trim(), title: '', duration: '', bullets: [] };
        }
      }
    }
    if (current) sections.experience.push(current);

    // Fix entries where title/company may be swapped
    sections.experience = sections.experience.map((exp) => {
      if (!exp.title && exp.company && titleKeywords.test(exp.company)) {
        return { ...exp, title: exp.company, company: '' };
      }
      return exp;
    });
  }

  // Education — improved to extract degree and year
  const eduIdx = lines.findIndex((l) => /^(education|academic(\s+background|\s+qualifications?)?|qualification)/i.test(l));
  if (eduIdx !== -1) {
    let eduEntry = null;

    for (let i = eduIdx + 1; i < Math.min(eduIdx + 20, lines.length); i++) {
      const line = lines[i];
      if (/^(experience|skills|project|certif|awards|work\s+history)/i.test(line)) break;

      const isBullet = line.startsWith('\u2022') || line.startsWith('-') || line.startsWith('*');
      if (isBullet) continue;

      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      const isDuration = durationPattern.test(line);
      const isDegree = /\b(bachelor|master|b\.?sc|m\.?sc|b\.?e|m\.?e|b\.?tech|m\.?tech|phd|doctorate|diploma|associate|mba|bba|mca|bca|b\.?a|m\.?a|b\.?com|m\.?com)\b/i.test(line);

      if (isDegree) {
        if (!eduEntry) eduEntry = { institution: '', degree: '', year: '', gpa: '' };
        eduEntry.degree = line.trim();
      } else if (isDuration || (yearMatch && line.length < 30)) {
        if (!eduEntry) eduEntry = { institution: '', degree: '', year: '', gpa: '' };
        eduEntry.year = yearMatch ? yearMatch[0] : line.trim();
      } else if (line.length > 3 && line.length < 100) {
        if (eduEntry && !eduEntry.institution) {
          eduEntry.institution = line.trim();
        } else {
          if (eduEntry) sections.education.push(eduEntry);
          eduEntry = { institution: line.trim(), degree: '', year: '', gpa: '' };
        }
      }
    }
    if (eduEntry && (eduEntry.institution || eduEntry.degree)) {
      sections.education.push(eduEntry);
    }
  }

  // Projects
  const projIdx = lines.findIndex((l) => /^(projects?|personal\s+projects?|academic\s+projects?)/i.test(l));
  if (projIdx !== -1) {
    let proj = null;
    for (let i = projIdx + 1; i < Math.min(projIdx + 30, lines.length); i++) {
      const line = lines[i];
      if (/^(education|skills|certif|experience|awards|work\s+history)/i.test(line)) break;
      const isBullet = line.startsWith('\u2022') || line.startsWith('-');
      if (!isBullet && line.length > 3 && line.length < 80) {
        if (proj) sections.projects.push(proj);
        proj = { name: line.trim(), description: '', technologies: [], link: '' };
      } else if (isBullet && proj) {
        const desc = line.replace(/^[\u2022\-]\s*/, '').trim();
        proj.description = proj.description ? proj.description + ' ' + desc : desc;
      }
    }
    if (proj) sections.projects.push(proj);
  }

  // Certifications
  const certIdx = lines.findIndex((l) => /^(certifications?|certificates?|licenses?)/i.test(l));
  if (certIdx !== -1) {
    for (let i = certIdx + 1; i < Math.min(certIdx + 10, lines.length); i++) {
      const line = lines[i];
      if (/^(education|skills|project|experience|awards)/i.test(line)) break;
      const clean = line.replace(/^[\u2022\-*]\s*/, '').trim();
      if (clean.length > 3) sections.certifications.push(clean);
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
