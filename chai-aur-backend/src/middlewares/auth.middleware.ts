import { ACCESS_TOKEN_SECRET } from "../constants";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized request, Access token is missing");
    }

    const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid token, User not found");
    }

    req.user = user;
    next();
  } catch (error: any) {
    throw new ApiError(
      401,
      error?.message || "Unauthorized request, Invalid token"
    );
  }
});
