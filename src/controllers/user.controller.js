import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  /**
   * User model is created using mongoose model, so it directly represents the DB data.
   * find function return boolean if some User exists with given query.
   * for checking multiple queries, we use $or operation and pass all values in array of objects.
   */

  if (existingUser) {
    throw new ApiError(409, "User with Email/Username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverLocalPath = req.files?.coverImage[0]?.path;
  let coverLocalPath;
  if (
    req?.files?.coverImage &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id)?.select(
    "-password -refreshToken"
  );
  //remove password & refreshtoken from user obj.

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while user registeration.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully."));
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

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; //assign the refreshToken into the object.
    await user.save({ validateBeforeSave: false }); //pass validateBeforeSave, coz on every save, User model is triggered then it'll try to find all the props of schema:
    //   password: {
    //     type: String,
    //     required: [true, "Password is required"]
    // },
    //so we say control, that don't validate anything,  simply save.

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Access/Refresh tokens."
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  /**
   * get user data from client
   * find username/email: validation
   * find the user
   * check password
   * access and refresh token
   * send cookie
   */

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password); //user is our reference of mongo user, User is mongo user document.
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid User Credentials.");
  }

  // generate access/refresh tokens.
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookies
  const options = {
    httpOnly: true, //only modified by server.
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  /**
   * find user (use middleware to find user using the accessToken user has sent in request.)
   * remove refreshToken from user
   */
  await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get user's access token
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized User");
  }
  try {
    //decode and match with DB refreshToken
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //find out the user, who's this.
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      //no such user
      throw new ApiError(401, "Unauthorized User.");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh Token expired or user.");
    }

    //re-generate access & refresh tokens for this user.
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user?._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed."
        )
      );
  } catch (error) {
    return new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const updateUserPassword = asyncHandler(async (req, res) => {
  //get old & new password from user
  const { oldPassword, newPassword } = req.body;
  console.log(req.body);

  //find the user, it's in req.user coz of verifyJWT middleware.
  const user = await User.findById(req.user._id);
  console.log("user", user);
  //check if we've got the right (old) password
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  console.log(isPasswordCorrect);
  if (!isPasswordCorrect) {
    console.log("inside");
    throw new ApiError(400, "Invalid Old Password Provided.");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  console.log("user", user);
  return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"))
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Data Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  //get new data from user
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email: email, //two ways to assign values.
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Data updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file missing.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  
  if (!avatar.url) {
    throw new ApiError(400, "Error while saving the file.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  );

  //delete old cloudinary image.
  return res
    .status(200)
    .json(new ApiResponse(201, user, "Avatar updated successfully."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  console.log(coverImageLocalPath);

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover file is required.");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while saving file to cloud.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res.status(200)
  .json(new ApiResponse(201, user, "Cover Image updated successfully."))
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateUserPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};
