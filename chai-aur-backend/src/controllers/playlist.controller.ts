import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from "express";

export const createPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, description } = req.body;

    //TODO: create playlist
    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name and description are required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, "Playlist created successfully", playlist));
  }
);

export const getUserPlaylists = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const playlists = await Playlist.find({ owner: userId });

    return res.status(200).json(new ApiResponse(200, "Playlists fetched successfully", playlists));
  }
);

export const getPlaylistById = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    //TODO: get playlist by id
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200, "Playlist fetched successfully", playlist));
  }
);

export const addVideoToPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    if (playlist.videos.includes(videoId as any)) {
        throw new ApiError(400, "Video already in playlist");
    }

    playlist.videos.push(videoId as any);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, "Video added to playlist successfully", playlist));
  }
);

export const removeVideoFromPlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId, videoId } = req.params;
    // TODO: remove video from playlist
    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID and Video ID are required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    playlist.videos = playlist.videos.filter((id: any) => id.toString() !== videoId);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, "Video removed from playlist successfully", playlist));
  }
);

export const deletePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(new ApiResponse(200, "Playlist deleted successfully", {}));
  }
);

export const updatePlaylist = asyncHandler(
  async (req: Request, res: Response) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist
    if (!playlistId) {
        throw new ApiError(400, "Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist");
    }

    if (name) playlist.name = name;
    if (description) playlist.description = description;

    await playlist.save();

    return res.status(200).json(new ApiResponse(200, "Playlist updated successfully", playlist));
  }
);
