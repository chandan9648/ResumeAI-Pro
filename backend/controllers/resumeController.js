const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { parsePDF } = require('../services/pdfParser');
const { parseDOCX } = require('../services/docxParser');
const { parseResumeTextHeuristic, optimizeResume } = require('../services/openaiService');
const { calculateATSScore } = require('../utils/atsCalculator');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const FREE_UPLOAD_LIMIT = 2;

// POST /api/resume/upload
const uploadResume = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // ── Free tier upload limit check ──────────────────────────────────────────
    if (user.subscriptionPlan === 'free' && user.uploadCount >= FREE_UPLOAD_LIMIT) {
      // Clean up uploaded file
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'You have reached your free upload limit of 2 resumes.',
        limitReached: true,
      });
    }

    if (!req.file) {
      return sendError(res, 400, 'No file uploaded. Please upload a PDF or DOCX file.');
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileType = ext === '.pdf' ? 'pdf' : 'docx';

    // ── Parse file ────────────────────────────────────────────────────────────
    let rawText = '';
    try {
      if (fileType === 'pdf') {
        rawText = await parsePDF(req.file.path);
      } else {
        rawText = await parseDOCX(req.file.path);
      }
    } catch (parseError) {
      fs.unlinkSync(req.file.path);
      return sendError(res, 422, `Could not parse file: ${parseError.message}`);
    }

    if (!rawText || rawText.trim().length < 50) {
      fs.unlinkSync(req.file.path);
      return sendError(res, 422, 'The uploaded file appears to be empty or unreadable.');
    }

    // ── Extract structured sections ───────────────────────────────────────────
    const parsedSections = parseResumeTextHeuristic(rawText);

    // ── Compute base ATS score (no JD yet) ───────────────────────────────────
    const { total, breakdown } = calculateATSScore(parsedSections, rawText, {});

    // ── Save to DB ────────────────────────────────────────────────────────────
    const title = req.body.title || `Resume ${user.uploadCount + 1}`;
    const resume = await Resume.create({
      userId: req.user.id,
      title,
      originalText: rawText,
      parsedSections,
      atsScore: total,
      atsBreakdown: breakdown,
      fileType,
    });

    // ── Increment upload counter ──────────────────────────────────────────────
    user.uploadCount += 1;
    await user.save();

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    return sendSuccess(res, 201, 'Resume uploaded and parsed successfully.', {
      resume,
      uploadsRemaining: Math.max(0, FREE_UPLOAD_LIMIT - user.uploadCount),
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return sendError(res, 500, error.message);
  }
};

// POST /api/resume/optimize
const optimizeResumeById = async (req, res) => {
  try {
    const { resumeId, jdText, missingSkills = [] } = req.body;

    if (!resumeId || !jdText) {
      return sendError(res, 400, 'resumeId and jdText are required.');
    }

    const resume = await Resume.findOne({ _id: resumeId, userId: req.user.id });
    if (!resume) {
      return sendError(res, 404, 'Resume not found.');
    }

    // AI optimization
    const optimized = await optimizeResume(resume.parsedSections, jdText, missingSkills);

    // Recalculate ATS with JD keywords
    const { total, breakdown } = calculateATSScore(optimized, resume.originalText, {
      keywords: missingSkills,
      required: missingSkills,
    });

    resume.optimizedSections = optimized;
    resume.atsScore = Math.min(total + 10, 100); // Optimization bonus
    resume.atsBreakdown = breakdown;
    resume.isOptimized = true;
    await resume.save();

    return sendSuccess(res, 200, 'Resume optimized successfully.', { resume });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/resume/ — all resumes for user
const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Resumes fetched.', { resumes });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// GET /api/resume/:id
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return sendError(res, 404, 'Resume not found.');
    return sendSuccess(res, 200, 'Resume fetched.', { resume });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// PUT /api/resume/:id — update sections manually
const updateResume = async (req, res) => {
  try {
    const { parsedSections, optimizedSections, title, templateId } = req.body;
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!resume) return sendError(res, 404, 'Resume not found.');

    if (parsedSections) resume.parsedSections = parsedSections;
    if (optimizedSections) resume.optimizedSections = optimizedSections;
    if (title) resume.title = title;
    if (templateId) resume.templateId = templateId;

    await resume.save();
    return sendSuccess(res, 200, 'Resume updated.', { resume });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// POST /api/resume/:id/duplicate
const duplicateResume = async (req, res) => {
  try {
    const original = await Resume.findOne({ _id: req.params.id, userId: req.user.id });
    if (!original) return sendError(res, 404, 'Resume not found.');

    const copy = await Resume.create({
      userId: req.user.id,
      title: `${original.title} (Copy)`,
      originalText: original.originalText,
      parsedSections: original.parsedSections,
      optimizedSections: original.optimizedSections,
      atsScore: original.atsScore,
      atsBreakdown: original.atsBreakdown,
      templateId: original.templateId,
      fileType: original.fileType,
      isOptimized: original.isOptimized,
    });

    return sendSuccess(res, 201, 'Resume duplicated.', { resume: copy });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

// DELETE /api/resume/:id
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!resume) return sendError(res, 404, 'Resume not found.');
    return sendSuccess(res, 200, 'Resume deleted.');
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  uploadResume,
  optimizeResumeById,
  getAllResumes,
  getResumeById,
  updateResume,
  duplicateResume,
  deleteResume,
};
