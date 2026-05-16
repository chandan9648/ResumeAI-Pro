const mammoth = require('mammoth');

/**
 * Parse a DOCX file and return extracted plain text
 * @param {string} filePath - Absolute path to the DOCX file
 * @returns {Promise<string>} extracted text
 */
const parseDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
};

module.exports = { parseDOCX };
