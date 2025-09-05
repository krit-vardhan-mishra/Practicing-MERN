const asyncHandler = (fn: any) => async (req: Request, res: Response, next: Function) => {
  try {
    await fn(req, res, next);
  } catch (error: any) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};

export { asyncHandler };
