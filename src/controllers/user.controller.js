import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existingUser = User.findOne({
    $or: [{ username }, { email }],
  });
  /**
   * User model is created using mongoose model, so it directly represents the DB data.
   * find function return boolean if some User exists with given query.
   * for checking multiple queries, we use $or operation and pass all values in array of objects.
   */

  if(existingUser){
    throw new ApiError(409, "User with Email/Username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  console.log(avatarLocalPath, coverLocalPath);

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required.")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverLocalPath);

  if(!avatar){
    throw new ApiError(400, "Avatar file is required.")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })

  const createdUser = await User.findById(user._id)?.select("-password -refreshToken");
  //remove password & refreshtoken from user obj.

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while user registeration.")
  }

  return res.status(201).json(new ApiResponse(200, createdUser, "User Created Successfully."));
});

/**
 * 1. get user data from frontend as per our model
 * 2. validation of all required fields
 * 3. check if user already exists: username/email
 * 4. upload files to cloudinary, avatar
 * 5. confirm if uploaded properly
 * 6. create user object- create entry in DB
 * 7. remove password, refreshToken from response received from creation operation
 * 8. check if properly created.
 * 9 return response.
 */

export { registerUser };
