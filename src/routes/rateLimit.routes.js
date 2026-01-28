const express = require("express");
const {
  checkAndUpdateRateLimit,
  getCurrentUsage
} = require("../services/rateLimit.service");

const router = express.Router();

/**
 * POST /api/hit
 *
 * Rate-limited endpoint.
 * Allows a user to make up to N requests per minute.
 */
router.post("/hit", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      message: "userId is required"
    });
  }

  try {
    const rateLimitResult = await checkAndUpdateRateLimit(userId);

    // Rate limit exceeded
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        message: "Rate limit exceeded"
      });
    }

    return res.status(200).json({
      message: "Request allowed",
      count: rateLimitResult.count
    });
  } catch (error) {
    console.error("Rate limit check failed:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

/**
 * GET /api/usage/:userId
 *
 * Debug endpoint to check current usage for a user
 * in the active 1-minute window.
 */
router.get("/usage/:userId", async (req, res) => {
  const { userId } = req.params;


  if (!userId) {
    return res.status(400).json({
      message: "userId is required"
    });
  }

  try {
    const usage = await getCurrentUsage(userId);
    return res.status(200).json(usage);
  } catch (error) {
    console.error("Failed to fetch usage:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

module.exports = router;
