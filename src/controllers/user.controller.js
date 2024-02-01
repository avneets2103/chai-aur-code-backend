import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { cloudinaryUploader } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const genAccessRefreshToken = async (user) => {
    try {
        const access = await user.generateAccessToken();
        const refresh = await user.generateRefreshToken();
        user.refreshToken = refresh;
        await user.save({validateBeforeSave: false});
        return {access, refresh};
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res)=>{
    // get user details from frontend
    // validation on the data we recieved
    // check if user already exsists?: username and email
    // check for images, check for avatar
    // upload them to cloudinary
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {fullName, email, username, password} = req.body;
    if(fullName===''){
        throw new ApiError(400, "Full name is required");
    }
    if(email===''){
        throw new ApiError(400, "Email is required");
    }
    if(username===''){
        throw new ApiError(400, "Username is required");
    }
    if(password===''){
        throw new ApiError(400, "Enter password");
    }

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existingUser){
        throw new ApiError(409, "Username or email already exsists");
    }

    // we are getting the key of files in the req, as we are using multer
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0].path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar required");
    }
    const avatar = await cloudinaryUploader(avatarLocalPath);
    const coverImage = await cloudinaryUploader(coverImageLocalPath);
    if(!avatar){throw new ApiError(400, "Avatar error");}
    const newUser = {
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email: email,
        password: password,
        username: username,
    };
    const user = await User.create(newUser);
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong");
    }
    console.log("Works till here");
    return res.status(201).json(new ApiResponse(200, createdUser, "User register Success"));
})

const loginUser = asyncHandler(async (req, res)=>{
    // req body se data le aao
    // username, email already exsist krta hai ki nhi?
    // find the user
    // password check
    // access and refresh token generate and send to user as secure cookies

    const {email, username, password} = req.body;
    if(!email && !username){
        throw new ApiError(400, "Enter username or email");
    }
    const user =  await User.findOne({
            $or: [{username}, {email}]
        }
    )
    if(!user){
        throw new ApiError(404, 'User doesnt exsist');
    }

    const passAuth = await user.isPasswordCorrect(password);
    if(!passAuth){
        throw new ApiError(401, "Password incorrect");
    }

    const {access, refresh} = await genAccessRefreshToken(user);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    const options = {
        httpOnly: true,
        secure: true,
    }
    // console.log({access, refresh});
    // console.log(res
    //     .status(200)
    //     .cookie("accessToken", access, options)
    //     .cookie("refreshToken", refresh, options)
    //     .json(
    //         {
    //             // "user": loggedInUser,
    //             "accessToken": access,
    //             "refreshToken": refresh,
    //             "message": "Login Success",
    //         }
    //     ));
    return res
    .status(200)
    .cookie("accessToken", access, options)
    .cookie("refreshToken", refresh, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, access, refresh
            },
            "User logged In Successfully"
        )
    )
})

const logout = asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken){
            throw new ApiError(401, "unauthorized access");
        }
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
        const user = User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "invalid refresh token");
        }
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {access, refresh} = await genAccessRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", access)
        .cookie("refreshToken", refresh)
        .json(
            new ApiResponse(
                200,
                {access, refresh},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message)
    }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const passAuth = await user.isPasswordCorrect(oldPassword);
    if(!passAuth){
        throw new ApiError(400, "Current password incorrect");
    }
    user.password = newPassword;
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            {}, 
            "Password changed"
        )
    );
})

const getCurrUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields required");
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account details modified")
    );
})

const updateUserAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");
    }
    const avatar = await cloudinaryUploader(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {
            new: true,
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar change sucsessful"
        )
    )
})

const updateUserCoverImg = asyncHandler(async(req, res)=>{
    const coverImgLocalPath = req.file?.path;
    if(!coverImgLocalPath){
        throw new ApiError(400, "Cover Img file is missing");
    }
    const coverImg = await cloudinaryUploader(coverImgLocalPath);
    if(!coverImg.url){
        throw new ApiError(400, "Error while uploading on cover Img");
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImg.url,
            }
        },
        {
            new: true,
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover Img change sucsessful"
        )
    )
})

export {
    registerUser, 
    loginUser, 
    logout, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrUser, 
    updateAccDetails,
    updateUserAvatar,
    updateUserCoverImg,

}