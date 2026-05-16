const JobDescription = require('../models/JobDescription');
const { analyzeJobDescription } = require('../services/openaiService');
const { calculateATSScore } = require('../utils/atsCalculator');
const Resume = require('../models/Resume');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// POST /api/jd/analyze
const analyzeJD = async (req, res) => {
  try {
    const { description, resumeId, jobTitle, companyName } = req.body;

    if (!description || description.trim().length < 30) {
      return sendError(res, 400, 'Please provide a meaningful job description (at least 30 characters).');
    }

    // AI-powered analysis
    const extracted = await analyzeJobDescription(description);

    // Save JD record
    const jd = await JobDescription.create({
      userId: req.user.id,
      resumeId: resumeId || null,
      jobTitle: jobTitle || extracted.jobTitle || '',
      companyName: companyName || '',
      description,
      extractedSkills: {
        required: extracted.required || [],
        preferred: extracted.preferred || [],
        keywords: extracted.keywords || [],
        responsibilities: extracted.responsibilities || [],
        experienceRequired: extracted.experienceRequired || '',
      },
    });

    // If resumeId provided, compute match score
    let matchScore = 0;
    let missingSkills = [];
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
      if (resume) {
        const atsResult = calculateATSScore(
          resume.parsedSections,
          resume.originalText,
          extracted
        );
        matchScore = atsResult.total;
        missingSkills = atsResult.missingSkills;

        // Update resume ATS score with JD context
        resume.atsScore = atsResult.total;
        resume.atsBreakdown = atsResult.breakdown;
        await resume.save();

        jd.matchScore = matchScore;
        jd.missingSkills = missingSkills;
        await jd.save();
      }
    }

    return sendSuccess(res, 201, 'Job description analyzed successfully.', {
      jd,
      extractedSkills: extracted,
      matchScore,
      missingSkills,
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/jd/ — all JDs for user
const getAllJDs = async (req, res) => {
  try {
    const jds = await JobDescription.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Job descriptions fetched.', { jds });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// DELETE /api/jd/:id
const deleteJD = async (req, res) => {
  try {
    const jd = await JobDescription.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!jd) return sendError(res, 404, 'Job description not found.');
    return sendSuccess(res, 200, 'Job description deleted.');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = { analyzeJD, getAllJDs, deleteJD };
