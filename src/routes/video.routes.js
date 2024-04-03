import { Router } from "express";
import { uploadVideo } from "../controllers/video.controller.js";
import { upload, handleMulterError } from "../midddlewares/multer.middleware.js";

const router = Router();

//create routers using this router
router.route("/upload-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },  //yet to handle the Multer error when user sends files beyond maxCount.
  ]),
  handleMulterError,
  uploadVideo
);

export default router;