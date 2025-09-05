import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request, Response } from "express";

export const healthcheck = asyncHandler(async (req: Request, res: Response) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  res.status(200).json(new ApiResponse(200, "API is healthy", {}));
});
