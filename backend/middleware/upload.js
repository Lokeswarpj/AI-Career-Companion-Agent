import multer from 'multer';

// Use memory storage so we can process buffer directly with pdf-parse and mammoth
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown'
    ];
    
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf', 'docx', 'doc', 'txt', 'md'];

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT file.'), false);
    }
  }
});
