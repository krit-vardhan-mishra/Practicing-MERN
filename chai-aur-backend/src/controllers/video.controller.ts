import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../models/cloudinary.js";
import { Request, Response } from "express";

export const getAllVideos = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    //TODO: get all videos based on query, sort, pagination
    const video = await Video.aggregate([
      {
        $match: { $and: [{ isPublished: true }, query ? { title: { $regex: query, $options: "i" } } : {}, userId ? { owner: userId } : {}] },
      },
      {
        $lookup: {
          from: "users",
          localField: "uploadedBy",
          foreignField: "_id",
          as: "uploadedBy",
        },
      },
      {
        $unwind: "$uploadedBy",
      },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          "uploadedBy.name": 1,
          "uploadedBy.email": 1,
        },
      },
      {
        $skip: (pageNumber - 1) * limitNumber,
      },
      {
        $limit: limitNumber,
      },
      {
        $sort: { [sortBy as string]: sortType === "asc" ? 1 : -1 },
      },
    ]);

    return res.status(200).json(new ApiResponse(200, "Videos fetched", video));
  }
);

export const publishAVideo = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    const videoLocalPath = req.files?.video[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoLocalPath) {
      throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is required");
    }

    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!video?.url) {
      throw new ApiError(400, "Failed to upload video");
    }

    if (!thumbnail?.url) {
      throw new ApiError(400, "Failed to upload thumbnail");
    }

    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    const newVideo = await Video.create({
      title,
      description,
      videoFile: video.url,
      thumbnail: thumbnail.url,
      owner: userId,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Video published successfully", newVideo));
  }
);

export const getVideoById = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId).populate(
      "uploadedBy",
      "name email"
    );

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Video fetched successfully", video));
  }
);

export const updateVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const { title, description, thumbnail } = req.body;
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail,
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.title = title || video.title;
  video.description = description || video.description;
  video.thumbnail = thumbnail || video.thumbnail;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", video));
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully", video));
});

export const togglePublishStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findByIdAndUpdate(
      videoId,
      [{ $set: { isPublished: { $not: "$isPublished" } } }],
      { new: true }
    );

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Video publish status toggled", video));
  }
);
