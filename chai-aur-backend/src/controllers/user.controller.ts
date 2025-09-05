import { Request, Response } from "express";
import { uploadOnCloudinary } from "../models/cloudinary";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { REFRESH_TOKEN_SECRET } from "../constants";
import mongoose from "mongoose";

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { username, fullName, email, password } = req.body;
    if (
      [fullName, email, username, password].some((field) => field?.trim() == "")
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existedUser) {
      throw new ApiError(409, "Username or email is already taken");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath
      ? await uploadOnCloudinary(coverImageLocalPath)
      : null;

    if (!avatar) {
      throw new ApiError(400, "Failed to upload avatar");
    }

    const newUser = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      username: username.toLowerCase(),
      password,
    });

    const createUser = await User.findById(newUser._id).select(
      "-password -refreshToken"
    );

    if (!createUser) {
      throw new ApiError(500, "Something went wrong while creating user.");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", createUser));
  }
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Password Incorrect, Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

export const generateAccessAndRefreshToken = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    try {
      const decodedToken = jwt.verify(
        incomingRefreshToken,
        REFRESH_TOKEN_SECRET
      );
      const user = await User.findById(decodedToken._id);

      if (!user) {
        throw new ApiError(401, "Invalid refresh token");
      }

      if (user.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token expired");
      }

      const options = {
        httpOnly: true,
        secure: true,
      };

      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
      );

      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(200, "Access token refreshed successfully", {
            accessToken,
            refreshToken,
          })
        );
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
    }
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const isPasswordCorrect = await user?.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Old password is incorrect");
    }

    if (!newPassword) {
      throw new ApiError(400, "New password is required");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, "Password changed successfully", {}));
  }
);

export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Current user fetched successfully", req.user)
      );
  }
);

export const updateAccountDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { fullName, email } = req.body;

    if (!fullName?.trim() || !email?.trim()) {
      throw new ApiError(400, "Full name and email are required");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { fullName, email },
      },
      { new: true }
    ).select("-password");

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, "Account details updated successfully", user));
  }
);

export const updateUserAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
      throw new ApiError(400, "Failed to upload avatar");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { avatar: avatar.url },
      },
      {
        new: true,
      }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, "User avatar updated successfully", user));
  }
);

export const updateUserCoverImage = asyncHandler(
  async (req: Request, res: Response) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
      throw new ApiError(400, "Failed to upload cover image");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { coverImage: coverImage.url },
      },
      {
        new: true,
      }
    ).select("-password");

    return res
      .status(200)
      .json(
        new ApiResponse(200, "User cover image updated successfully", user)
      );
  }
);

export const getUserChannelProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { username } = req.params;

    if (!username?.trim()) {
      throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
      {
        $match: { username: username.toLowerCase() },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: { $size: "$subscribers" },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);

    console.log(channel);
    if (!channel?.length) {
      throw new ApiError(404, "Channel not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Channel fetched successfully", channel[0]));
  }
);

export const getWatchHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
    ]);

    console.log(user);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Watch history fetched successfully",
          user[0].watchHistory
        )
      );
  }
);
