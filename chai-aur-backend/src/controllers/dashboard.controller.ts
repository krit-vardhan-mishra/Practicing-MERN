import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Request, Response } from "express"

export const getChannelStats = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;

    const stats = await Video.aggregate([
        {
            $match: { owner: userId }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: { $size: "$likes" } }
            }
        }
    ]);

    const subscribers = await Subscription.countDocuments({ channel: userId });

    const channelStats = {
        totalVideos: stats[0]?.totalVideos || 0,
        totalViews: stats[0]?.totalViews || 0,
        totalLikes: stats[0]?.totalLikes || 0,
        totalSubscribers: subscribers
    };

    return res.status(200).json(new ApiResponse(200, "Channel stats fetched successfully", channelStats));
})

export const getChannelVideos = asyncHandler(async (req: Request, res: Response) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id;

    const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, "Channel videos fetched successfully", videos));
})
