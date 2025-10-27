import express, { type Request, Response, NextFunction } from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup Apollo GraphQL Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }: { req: Request }) => ({
      userId: req.isAuthenticated() ? req.user?.id : undefined,
      user: req.user,
    }),
    formatError: (err) => {
      log(`GraphQL Error: ${err.message}`);
      return err;
    },
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ 
    app: app as any, 
    path: "/graphql",
    cors: false, // Use express cors settings
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite or serve static assets based on environment
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start the server on port 5000
  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on http://localhost:${port}`);
    log(`Press Ctrl+C to exit.`);
  });
})();
