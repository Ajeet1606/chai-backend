import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  if (!username || !email) {
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

export { registerUser, loginUser, logoutUser };
