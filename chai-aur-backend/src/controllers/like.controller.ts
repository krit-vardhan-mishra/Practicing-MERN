import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from "express";

export const toggleVideoLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }

    const video = await Like.findOne({ video: videoId, user: req.user._id });

    if (video) {
      // Video is already liked, so unlike it
      await video.remove();
      return res
        .status(200)
        .json(new ApiResponse(200, "Video unliked successfully", {}));
    }

    const newLike = new Like({ video: videoId, user: req.user._id });
    await newLike.save();

    return res
      .status(201)
      .json(new ApiResponse(201, "Video liked successfully", newLike));
  }
);

export const toggleCommentLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { commentId } = req.params;
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Like.findOne({
      comment: commentId,
      user: req.user._id,
    });

    if (comment) {
      // Comment is already liked, so unlike it
      await comment.remove();
      return res
        .status(200)
        .json(new ApiResponse(200, "Comment unliked successfully", {}));
    }

    const newLike = new Like({ comment: commentId, user: req.user._id });
    await newLike.save();

    return res
      .status(201)
      .json(new ApiResponse(201, "Comment liked successfully", newLike));
  }
);

export const toggleTweetLike = asyncHandler(
  async (req: Request, res: Response) => {
    const { tweetId } = req.params;
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Like.findOne({ tweet: tweetId, user: req.user._id });
    if (tweet) {
      // Tweet is already liked, so unlike it
      await tweet.remove();
      return res
        .status(200)
        .json(new ApiResponse(200, "Tweet unliked successfully", {}));
    }

    const newLike = new Like({ tweet: tweetId, user: req.user._id });
    await newLike.save();

    return res
      .status(201)
      .json(new ApiResponse(201, "Tweet liked successfully", newLike));
  }
);

export const getLikedVideos = asyncHandler(
  async (req: Request, res: Response) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({
      user: req.user._id,
      video: { $ne: null },
    }).populate("video");
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Liked videos fetched successfully", likedVideos)
      );
  }
);
