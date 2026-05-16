const mongoose = require('mongoose');

const jobDescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    jobTitle: { type: String, default: '' },
    companyName: { type: String, default: '' },
    description: { type: String, required: true },
    extractedSkills: {
      required: [{ type: String }],
      preferred: [{ type: String }],
      keywords: [{ type: String }],
      responsibilities: [{ type: String }],
      experienceRequired: { type: String, default: '' },
    },
    matchScore: { type: Number, default: 0 },
    missingSkills: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobDescription', jobDescriptionSchema);
