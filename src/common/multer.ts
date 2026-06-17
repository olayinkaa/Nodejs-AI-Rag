import multer from "multer";

const storage = multer.memoryStorage(); // so file stays in memory
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    // Validate file type constraints strictly
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are supported."));
    }
    cb(null, true);
  },
});
