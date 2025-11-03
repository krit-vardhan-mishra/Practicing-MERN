import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { db, pool } from "./db";
import {
  users,
  type User as SelectUser,
  insertUserSchema,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function generateIdentityKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
    secretKey: naclUtil.encodeBase64(keyPair.secretKey),
  };
}

export function setupAuth(app: Express) {
  const PgStore = connectPg(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "real-time-chat-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
      sameSite: "lax",
    },
    store: new PgStore({
      pool: pool, // Use the existing PostgreSQL connection pool
      tableName: "session", // Table name for storing sessions
      createTableIfMissing: true, // Automatically create the session table
      errorLog: console.error.bind(console), // Log errors
    }),
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Normalize username to lowercase for consistent login
        const normUsername = (username || "").toLowerCase();
        const [user] = await db
          .select()
          .from(users)
          .where(sql`lower(${users.username}) = ${normUsername}`)
          .limit(1);
        if (!user) return done(null, false, { message: "Incorrect username" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return done(null, false, { message: "Incorrect password" });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Validation error:", result.error.errors);
        return res.status(400).send("Invalid input: " + result.error.errors.map(e => e.message).join(", "));
      }

      let { username, password, fullName, email, avatar, gender } = result.data;
      // Normalize username to lowercase for storage
      username = (username || "").toLowerCase();

      const [existingUser] = await db
        .select()
        .from(users)
        .where(sql`lower(${users.username}) = ${username}`)
        .limit(1);
      if (existingUser) return res.status(400).send("Username already exists");

      const hashedPassword = await bcrypt.hash(password, 10);
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          fullName,
          email,
          avatar,
          gender,
        })
        .returning();

      req.login(newUser, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            fullName: newUser.fullName,
            email: newUser.email,
            avatar: newUser.avatar,
            gender: newUser.gender,
          },
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

   app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: { message?: string }) => {
      if (err) return next(err);
      if (!user) return res.status(400).send(info.message ?? "Login failed");

      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            avatar: user.avatar,
            gender: user.gender,
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}
