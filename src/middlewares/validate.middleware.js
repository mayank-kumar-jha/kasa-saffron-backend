import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(new ApiError(400, 'Validation failed', formattedErrors));
    }
    return next(new ApiError(500, 'Internal Server Error'));
  }
};

export { validate };
