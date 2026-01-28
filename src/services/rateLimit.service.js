const RateLimit = require("../models/ RateLimit");
const { RATE_LIMIT_PER_MINUTE } = require("../config/rateLimit.config");

/**
 * Returns the current epoch minute.
 * Used to enforce a fixed 1-minute rate-limiting window.
 */
function getCurrentEpochMinute() {
  return Math.floor(Date.now() / 60000);
}

/**
 * Checks whether a request is allowed for the given user
 * and updates the rate-limit counter accordingly.
 */
async function checkAndUpdateRateLimit(userId) {
  const epochMinute = getCurrentEpochMinute();

  /**
   * STEP 1:
   * Atomically increment the request count
   * ONLY if the current count is below the limit.
   * This operation is concurrency-safe.
   */
  const updatedRateLimit = await RateLimit.findOneAndUpdate(
    {
      userId,
      minute: epochMinute,
      count: { $lt: RATE_LIMIT_PER_MINUTE }
    },
    { $inc: { count: 1 } },
    { new: true }
  );

  // Case 1: Increment succeeded → request allowed
  if (updatedRateLimit) {
    return {
      allowed: true,
      count: updatedRateLimit.count
    };
  }

  /**
   * STEP 2:
   * If increment failed, check whether this is the
   * first request for the current minute.
   */
  const existingRateLimit = await RateLimit.findOne({
    userId,
    minute: epochMinute
  });

  // Case 2: First request of the minute → create new record
  if (!existingRateLimit) {
    const newRateLimit = await RateLimit.create({
      userId,
      minute: epochMinute,
      count: 1
    });

    return {
      allowed: true,
      count: newRateLimit.count
    };
  }

  /**
   * STEP 3:
   * Record exists and limit has already been reached
   * → block the request.
   */
  return {
    allowed: false
  };
}




/**
 * Returns the current usage for a user
 * in the active 1-minute window.
 */

async function getCurrentUsage(userId) {
  const epochMinute = getCurrentEpochMinute();

  const rateLimitRecord = await RateLimit.findOne({
    userId,
    minute: epochMinute
  });

  return {
    userId,
    minute: new Date(epochMinute * 60000)
      .toISOString()
      .slice(0, 16),
    count: rateLimitRecord ? rateLimitRecord.count : 0,
    limit: RATE_LIMIT_PER_MINUTE
  };
}

module.exports = {
  checkAndUpdateRateLimit,
  getCurrentUsage
};
