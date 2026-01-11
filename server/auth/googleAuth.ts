/**
 * Google OAuth Authentication Module
 * 
 * Handles Google OAuth 2.0 / OpenID Connect authentication using Passport.js
 * and openid-client. Provides session management, token refresh, and
 * multi-domain strategy support.
 */

import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

// =============================================================================
// Constants
// =============================================================================

/** Session time-to-live: 7 days in milliseconds */
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

/** Cache duration for OIDC configuration: 1 hour in milliseconds */
const OIDC_CONFIG_CACHE_TTL = 3600 * 1000;

/** Default Google OAuth issuer URL */
const DEFAULT_ISSUER_URL = "https://accounts.google.com";

/** OAuth scope for user profile and email */
const OAUTH_SCOPE = "openid email profile";

/** Session cookie name used by express-session */
const SESSION_COOKIE_NAME = "connect.sid";

// =============================================================================
// Types
// =============================================================================

/**
 * Claims from the OpenID Connect ID token
 */
interface OAuthClaims {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * User session object stored in passport session
 */
interface UserSession {
  claims?: OAuthClaims;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// =============================================================================
// OIDC Configuration
// =============================================================================

/**
 * Retrieves and caches the OpenID Connect configuration.
 * Uses memoization to avoid repeated discovery requests.
 * Cache is refreshed every hour.
 * 
 * @returns Promise resolving to the OIDC configuration
 */
const getOidcConfig = memoize(
  async (): Promise<client.Configuration> => {
    const issuerUrl = process.env.ISSUER_URL ?? DEFAULT_ISSUER_URL;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing required environment variables: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
    }

    return await client.discovery(
      new URL(issuerUrl),
      clientId,
      clientSecret
    );
  },
  { maxAge: OIDC_CONFIG_CACHE_TTL }
);

// =============================================================================
// Session Management
// =============================================================================

/**
 * Creates and configures Express session middleware with PostgreSQL store.
 * 
 * Sessions are stored in the database for persistence across server restarts.
 * Cookies are HTTP-only and secure in production.
 * 
 * @returns Configured express-session middleware
 */
export function getSession(): RequestHandler {
  const sessionSecret = process.env.SESSION_SECRET;
  const databaseUrl = process.env.DATABASE_URL;

  if (!sessionSecret) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: databaseUrl,
    createTableIfMissing: false,
    ttl: SESSION_TTL,
    tableName: "sessions",
  });

  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL,
    },
  });
}

/**
 * Updates the user session with fresh tokens from OAuth response.
 * 
 * @param user - User session object to update
 * @param tokens - Token response from authorization server
 */
function updateUserSession(
  user: UserSession,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
): void {
  const claims = tokens.claims() as OAuthClaims;
  user.claims = claims;
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = claims?.exp;
}

/**
 * Creates or updates user record in database from OAuth claims.
 * 
 * @param claims - Claims from the ID token
 */
async function upsertUser(claims: OAuthClaims): Promise<void> {
  await authStorage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.given_name,
    lastName: claims.family_name,
    profileImageUrl: claims.picture,
  });
}

// =============================================================================
// Authentication Setup
// =============================================================================

/**
 * Configures Passport.js authentication with Google OAuth.
 * 
 * Sets up:
 * - Express session middleware
 * - Passport initialization
 * - Dynamic strategy registration per domain
 * - Authentication routes (/api/login, /api/callback, /api/logout)
 * 
 * Supports multi-domain deployments by creating separate strategies
 * for each hostname to handle different redirect URLs.
 * 
 * @param app - Express application instance
 */
export async function setupAuth(app: Express): Promise<void> {
  // Trust proxy headers (required for secure cookies behind reverse proxy)
  app.set("trust proxy", 1);
  
  // Initialize session and passport
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Get OIDC configuration
  const config = await getOidcConfig();

  /**
   * Verification callback invoked after successful OAuth authentication.
   * Creates user session and persists user to database.
   */
  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: UserSession = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims() as OAuthClaims);
    verified(null, user);
  };

  // Track registered strategies to avoid duplicates
  const registeredStrategies = new Set<string>();

  /**
   * Ensures a Passport strategy exists for the given domain.
   * Creates strategy on-demand to support dynamic callback URLs.
   * 
   * @param domain - Hostname for the strategy
   */
  const ensureStrategy = (domain: string): void => {
    const strategyName = `google:${domain}`;
    
    if (!registeredStrategies.has(strategyName)) {
      const callbackURL = process.env.CALLBACK_URL || `http://localhost:5000/api/callback`;
      
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: OAUTH_SCOPE,
          callbackURL,
        },
        verify
      );
      
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  // Passport serialization (stores user object in session)
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // ==========================================================================
  // Authentication Routes
  // ==========================================================================

  /**
   * GET /api/login
   * Initiates OAuth flow by redirecting to Google's consent page
   */
  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`google:${req.hostname}`, {
      prompt: "consent",
      scope: ["openid", "email", "profile"],
    })(req, res, next);
  });

  /**
   * GET /api/callback
   * OAuth callback endpoint - handles the redirect from Google
   */
  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    
    // Use custom callback to handle errors properly
    passport.authenticate(`google:${req.hostname}`, (err: any, user: any, info: any) => {
      if (err) {
        console.error("Passport authentication error:", err);
        return res.redirect("/api/login");
      }
      
      if (!user) {
        console.error("Authentication failed - no user returned:", info);
        return res.redirect("/api/login");
      }
      
      // Manually log in the user
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return next(loginErr);
        }
        
        console.log("Authentication successful for user:", user.claims?.email);
        return res.redirect("/");
      });
    })(req, res, next);
  });

  /**
   * GET /api/logout
   * Logs out user by destroying session and clearing cookies
   */
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Destroy session in database
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
        }
        
        // Clear session cookie from browser
        res.clearCookie(SESSION_COOKIE_NAME, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
        
        // Redirect to home page
        res.redirect("/");
      });
    });
  });
}

// =============================================================================
// Authentication Middleware
// =============================================================================

/**
 * Middleware to protect routes requiring authentication.
 * 
 * Validates:
 * 1. User is authenticated via passport
 * 2. Access token has not expired
 * 3. Attempts to refresh token if expired and refresh token available
 * 
 * Returns 401 Unauthorized if any check fails.
 * 
 * @example
 * app.get('/api/protected', isAuthenticated, (req, res) => {
 *   res.json({ user: req.user });
 * });
 */
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as UserSession | undefined;

  // Check if user is authenticated and has expiry info
  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if token is still valid
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired - attempt refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    console.error("Token refresh failed:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
