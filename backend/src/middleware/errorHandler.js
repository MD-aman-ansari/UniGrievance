/**
 * Centralized Error Handling Middleware
 * 
 * Ensures all uncaught errors return a consistent, predictable JSON response
 * to the client, preventing server crashes and obscuring internal stack traces in production.
 */

/**
 * 404 Not Found handler for undefined API routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Resource Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global Error Handler (4 arguments required by Express to identify error middleware)
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Log the error internally for server debugging
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  // Catch Oversized Body Payload (413 Payload Too Large)
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      success: false,
      error: 'Payload Too Large',
      message: 'Request payload exceeds the maximum allowed limit of 50KB. Oversized input blocked.',
    });
  }

  // Catch Malformed JSON syntax in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON',
      message: 'The request body contains invalid JSON syntax.',
    });
  }

  const statusCode = err.statusCode || 500;
  
  // Sanitize internal error messages in production to prevent leaking database names, credentials, or table schemes
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage = isProduction && statusCode === 500
    ? 'An internal server error occurred. Our team has been notified.'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : (err.error || 'Request Error'),
    message: clientMessage,
    // NEVER leak stack traces in production
    ...(!isProduction && err.stack ? { stack: err.stack } : {}),
  });
};
