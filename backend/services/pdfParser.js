const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Parse a PDF file and return extracted plain text
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} extracted text
 */
const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

module.exports = { parsePDF };
