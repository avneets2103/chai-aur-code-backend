import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {cloudinaryUploader} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js";

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

    const existingUser = User.findOne({
        $or: [{username}, {email}]
    })
    if(existingUser){
        throw new ApiError(409, "Username or email already exsists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0].path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar required");
    }
    const avatar = await cloudinaryUploader(avatarLocalPath);
    const coverImage = await  cloudinaryUploader(coverImageLocalPath);

    if(!avatar){throw new ApiError(400, "Avatar error");}

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        converImage: coverImage?.url || "",
        email,
        password,
        username,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong");
    }

    return res.status(201).json(new ApiResponse(200, createdUser, message="User register Success"));
})

export {registerUser}