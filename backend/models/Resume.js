const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'My Resume',
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    // Raw extracted text from uploaded file
    originalText: {
      type: String,
      default: '',
    },
    // Parsed into structured sections
    parsedSections: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      summary: { type: String, default: '' },
      skills: [{ type: String }],
      experience: [
        {
          company: String,
          title: String,
          duration: String,
          bullets: [String],
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          year: String,
          gpa: String,
        },
      ],
      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
          link: String,
        },
      ],
      certifications: [{ type: String }],
    },
    // AI-optimized version of parsedSections
    optimizedSections: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    atsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    atsBreakdown: {
      keywordMatch: { type: Number, default: 0 },
      skillMatch: { type: Number, default: 0 },
      sectionCompleteness: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      readability: { type: Number, default: 0 },
    },
    templateId: {
      type: String,
      enum: ['modern', 'ats-friendly', 'minimal', 'creative'],
      default: 'modern',
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
    },
    isOptimized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
