import rateLimit from 'express-rate-limit';

export const formSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // Limit each IP to 2 requests per `window` (here, per 24 hours)
  message: {
    success: false,
    message: "You have reached the maximum limit of 2 submissions per day. Please come back tomorrow for more orders."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: { xForwardedForHeader: false }
});
