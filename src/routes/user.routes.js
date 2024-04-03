import {Router} from 'express';
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, updateUserPassword } from '../controllers/user.controller.js';
import { verifyJWT } from '../midddlewares/auth.middleware.js';
import {upload} from '../midddlewares/multer.middleware.js';

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(
    verifyJWT,
    logoutUser);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").post(verifyJWT, updateUserPassword);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router.route("/update-profile").post(verifyJWT, updateAccountDetails);
router.route("/update-avatar").post(upload.single("avatar"), verifyJWT, updateUserAvatar);
router.route("/update-cover").post(upload.single("coverImage"), verifyJWT, updateUserCoverImage);

export default router;