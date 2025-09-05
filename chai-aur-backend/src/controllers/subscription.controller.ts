import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Request, Response } from "express"


export const toggleSubscription = asyncHandler(async (req: Request, res: Response) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, "Unsubscribed successfully", {}));
    } else {
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        });
        return res.status(201).json(new ApiResponse(201, "Subscribed successfully", subscription));
    }
})

// controller to return subscriber list of a channel
export const getUserChannelSubscribers = asyncHandler(async (req: Request, res: Response) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const subscribers = await Subscription.find({ channel: channelId }).populate("subscriber", "username fullName avatar");

    return res.status(200).json(new ApiResponse(200, "Subscribers fetched successfully", subscribers));
})

// controller to return channel list to which user has subscribed
export const getSubscribedChannels = asyncHandler(async (req: Request, res: Response) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber ID is required");
    }

    const channels = await Subscription.find({ subscriber: subscriberId }).populate("channel", "username fullName avatar");

    return res.status(200).json(new ApiResponse(200, "Subscribed channels fetched successfully", channels));
})