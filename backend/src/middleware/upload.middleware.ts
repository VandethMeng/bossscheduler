import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const meetingMinutesUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      cb(null, true);
      return;
    }

    cb(new Error('Only PDF files are allowed for meeting minutes'));
  },
});

export const handleMeetingMinutesUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  meetingMinutesUpload.single('file')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new Error('PDF file must be 10MB or smaller'));
        return;
      }
      next(new Error(err.message));
      return;
    }

    next(err instanceof Error ? err : new Error('File upload failed'));
  });
};
