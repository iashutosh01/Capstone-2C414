import { validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors from express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorMessages.join(', '),
        details: errors.array(),
      },
    });
  }

  next();
};
