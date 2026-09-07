import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts raw text from uploaded resume buffer based on MIME type or extension.
 */
export async function extractResumeText(fileBuffer, mimeType = '', originalName = '') {
  try {
    const ext = originalName.split('.').pop()?.toLowerCase() || '';

    // PDF files
    if (mimeType === 'application/pdf' || ext === 'pdf') {
      const parsed = await pdfParse(fileBuffer);
      return parsed.text ? parsed.text.trim() : '';
    }

    // DOCX files
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword' ||
      ext === 'docx' ||
      ext === 'doc'
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value ? result.value.trim() : '';
    }

    // Plain text / Markdown / other text formats
    return fileBuffer.toString('utf-8').trim();
  } catch (err) {
    console.error('[ResumeParser] Extraction error:', err);
    throw new Error(`Failed to extract text from resume: ${err.message}`);
  }
}
