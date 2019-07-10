import multer from 'multer';
import { resolve, extname } from 'path';
import { randomBytes } from 'crypto';

export default {
  storage: multer.diskStorage({
    destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
    filename: (req, file, cb) => {
      randomBytes(16, (err, buf) => {
        if (err) cb(err);

        return cb(null, buf.toString('hex') + extname(file.originalname));
      });
    },
  }),
};
