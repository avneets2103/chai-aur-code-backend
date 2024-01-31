import {Router} from "express";
import { loginUser, logout, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const UserRouter = Router();
UserRouter.route('/register').post(
    // middlewares
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser
);
UserRouter.route('/login').post(loginUser);
UserRouter.route('/logout').post(
    verifyJWT,
    logout
);

export {UserRouter}