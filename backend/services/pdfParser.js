const { PDFParse } = require('pdf-parse');
const fs = require('fs');

/**
 * Parse a PDF file and return extracted plain text
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {Promise<string>} extracted text
 */
const parsePDF = async (filePath) => {
  let parser;
  try {
    const dataBuffer = fs.readFileSync(filePath);
    parser = new PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    return data.text || '';
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
};

module.exports = { parsePDF };
