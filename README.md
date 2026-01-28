How Rate Limiting Is Enforced

This service applies a fixed one-minute rate limit per user.

For every incoming request, the backend calculates the current minute using epoch time:

Math.floor(Date.now() / 60000)

All requests that fall within the same minute share this value.
Each request is then grouped using a combination of:

(userId, currentMinute)

For every such pair, a single MongoDB document is used to track how many requests the user has made in that minute.

When a request arrives:

If the user has made fewer than 5 requests in the current minute, the request is allowed and the counter is incremented.

If the user has already reached the limit, the request is rejected with HTTP 429 (Too Many Requests).

This ensures that no user can make more than 5 requests in any one-minute window.




How Concurrent Requests Are Handled

The rate limiter is designed to work correctly even when multiple requests arrive at the same time.

To achieve this, it relies on MongoDB’s atomic update operations.
The core operation uses findOneAndUpdate with a conditional filter:

{ userId, minute, count: { $lt: RATE_LIMIT_PER_MINUTE } }


MongoDB guarantees that updates to a single document are atomic. This means:

If several requests hit the API at the same moment, only the first 5 requests are able to increment the counter.

Once the limit is reached, all subsequent requests fail the condition and receive HTTP 429.

Because no counters are stored in application memory, there are no race conditions, even under heavy concurrency.




What Happens When the Service Restarts

All rate-limiting data is persisted in MongoDB.

Request counts are stored in the database.

No state is kept in memory inside the Node.js process.

If the service restarts:

Existing (userId, minute) records remain unchanged.

The next request continues from the correct count for the current minute.

As a result, restarting the service does not reset rate limits, and the system behaves consistently.




Tradeoffs and Future Improvements
Tradeoffs Made

A fixed window rate-limiting strategy is used.

This approach is intentionally simple and easy to reason about. However, it can allow small bursts of traffic at minute boundaries (for example, requests just before and just after a new minute begins).

MongoDB is chosen for correctness and persistence, rather than maximum performance.





What Would Change at Larger Scale

At higher traffic volumes, the following improvements could be made:

Use Redis instead of MongoDB for faster, in-memory atomic counters.

Switch to sliding window or token bucket algorithms for smoother rate limiting.

Support distributed rate limiting across multiple services.

Introduce per-endpoint or per-plan rate limits.