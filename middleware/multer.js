import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileFilter = (req, file, callback) => {
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedFileTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error("Invalid file type. Only JPEG, JPG, and PNG files are allowed."));
    }
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, callback) => {
        const timestamps = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        callback(null, `{name}-{timestamps}{ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB
    }
});

export default upload;