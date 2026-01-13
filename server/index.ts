/**
 * Server Entry Point
 * 
 * Initializes the Express application with:
 * - Environment configuration
 * - Middleware setup
 * - Authentication
 * - API routes
 * - Static file serving (production) or Vite dev server (development)
 * - Database seeding
 */

import { config } from "dotenv";
config(); // Load environment variables from .env file

import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth, registerAuthRoutes } from "./auth";
import { seedDemoData } from "./seed-demo";

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PORT = 5000;
const DEFAULT_HOST = "0.0.0.0";

// =============================================================================
// Server Initialization
// =============================================================================

const app = express();
const httpServer = createServer(app);

// Extend Express types to support rawBody
declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// =============================================================================
// Security Middleware
// =============================================================================

/**
 * Helmet.js - Sets security-related HTTP headers
 * Protects against XSS, clickjacking, MIME sniffing, and other attacks
 */
if (process.env.NODE_ENV === "production") {
  // Strict security headers for production
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Needed for Tailwind/styled components
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    })
  );
} else {
  // Relaxed security for development (allows Vite HMR and dev tools)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP in dev to allow Vite HMR
      crossOriginEmbedderPolicy: false, // Allow Vite dev server
    })
  );
}

// =============================================================================
// Middleware Configuration
// =============================================================================

/**
 * JSON body parser with raw body capture
 * Useful for webhook verification that requires raw body
 */
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

/** URL-encoded body parser for form submissions */
app.use(express.urlencoded({ extended: false }));

// =============================================================================
// Logging Utility
// =============================================================================

/**
 * Logs a message with timestamp and source prefix
 * 
 * @param message - Message to log
 * @param source - Source identifier (default: "express")
 * 
 * @example
 * log("Server started on port 5000");
 * // Output: "9:00:00 PM [express] Server started on port 5000"
 */
export function log(message: string, source = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// =============================================================================
// Request Logging Middleware
// =============================================================================

/**
 * Logs API requests with method, path, status, duration, and optionally response size.
 * Only logs requests to /api/* endpoints to reduce noise.
 * 
 * Follows best practices:
 * - Response bodies NOT logged by default (security, performance, readability)
 * - Set LOG_RESPONSE_BODIES=true in .env for verbose debugging
 * - Errors (status >= 400) always include response body for troubleshooting
 */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  let responseSize = 0;

  // Intercept res.json to capture response metadata
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    // Calculate response size
    try {
      responseSize = JSON.stringify(bodyJson).length;
    } catch {
      responseSize = 0;
    }
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log after response is sent
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Only log API routes
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Add response size for context (helpful without being verbose)
      if (responseSize > 0) {
        const sizeKb = (responseSize / 1024).toFixed(1);
        logLine += ` (${sizeKb}kb)`;
      }
      
      // Include response body for errors (status >= 400) or if verbose logging enabled
      const isError = res.statusCode >= 400;
      const verboseLogging = process.env.LOG_RESPONSE_BODIES === "true";
      
      if (capturedJsonResponse && (isError || verboseLogging)) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// =============================================================================
// Application Setup
// =============================================================================

/**
 * Asynchronous initialization of the application
 * Sets up authentication, routes, seeding, error handling, and starts the server
 */
(async () => {
  try {
    // Initialize authentication (session, passport, OAuth)
    await setupAuth(app);
    registerAuthRoutes(app);
    
    // Register API routes
    await registerRoutes(httpServer, app);
    
    // Seed demo data if not exists
    await seedDemoData();

    // ==========================================================================
    // Global Error Handler
    // ==========================================================================

    /**
     * Express error handling middleware
     * Catches errors from routes and sends appropriate HTTP responses
     */
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      // If headers were already sent (e.g., by a redirect), don't try to send again
      if (res.headersSent) {
        console.error("Error occurred after headers were sent:", err);
        return next(err);
      }

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log the error for debugging
      console.error("Express error handler:", {
        status,
        message,
        stack: err.stack,
      });

      res.status(status).json({ message });
    });

    // ==========================================================================
    // Static File Serving / Dev Server
    // ==========================================================================

    if (process.env.NODE_ENV === "production") {
      // Production: Serve built static files
      serveStatic(app);
    } else {
      // Development: Use Vite dev server with HMR
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // ==========================================================================
    // Start Server
    // ==========================================================================

    const port = parseInt(process.env.PORT || String(DEFAULT_PORT), 10);
    const host = DEFAULT_HOST;

    httpServer.listen(port, host, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Fatal error during server initialization:", error);
    process.exit(1);
  }
})();
