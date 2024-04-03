import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
      //find accessToken
      const accessToken =
        req.cookies?.accessToken ||
        req.header("Authorization").replace("Bearer ", "");
    
      if (!accessToken) {
        throw new ApiError(401, "Unauthorized Request");
      }
    
      //validate token using jwt
      const decodedToken = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET
      );
    
      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );
      /**
         * _id: this._id,
                email: this.email,
                username: this.username,
                fullName: this.fullName 
        _id coming from the details we had provided while signing the token.
         */
    
      if (!user) {
        throw new ApiError(401, "Invalid Access Token.");
      }
    
      req.user = user;
      next();
  } catch (error) {
      throw new ApiError(401, error?.message || "Something went wrong");
  }
});
