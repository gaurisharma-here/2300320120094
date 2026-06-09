import sendLog from "./logger.js";

function loggingMiddleware(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    sendLog("backend", level, "handler", message);
  });

  next();
}

export default loggingMiddleware;
