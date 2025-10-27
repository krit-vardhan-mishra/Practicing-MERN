import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as IOServer } from "socket.io";
import { setupAuth } from "./auth";
import { setupSocket } from "./socket";
import { db } from "./db";
import { 
  conversations, 
  conversationParticipants, 
  messages, 
  users,
} from "@shared/schema";
import { eq, and, or, inArray, desc, lt, ne } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get all conversations for the current user
  app.get("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;

      // Get all conversations where user is a participant
      const userConversations = await db
        .select({
          conversation: conversations,
          participant: conversationParticipants,
        })
        .from(conversationParticipants)
        .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
        .where(eq(conversationParticipants.userId, userId));

      // Get the other participants for each conversation
      const conversationsWithParticipants = await Promise.all(
        userConversations.map(async ({ conversation }) => {
          const participants = await db
            .select({
              user: users,
            })
            .from(conversationParticipants)
            .innerJoin(users, eq(conversationParticipants.userId, users.id))
            .where(eq(conversationParticipants.conversationId, conversation.id));

          // Get last message
          const [lastMessage] = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversation.id))
            .orderBy(desc(messages.createdAt))
            .limit(1);

          return {
            ...conversation,
            participants: participants.map(p => ({
              id: p.user.id,
              username: p.user.username,
              fullName: p.user.fullName,
              avatar: p.user.avatar,
            })),
            lastMessage: lastMessage || null,
          };
        })
      );

      res.json(conversationsWithParticipants);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get or create a conversation between two users
  app.post("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;
      const { recipientId } = req.body;

      if (!recipientId || recipientId === userId) {
        return res.status(400).json({ message: "Invalid recipient" });
      }

      // Check if conversation already exists
      const existingConversations = await db
        .select({ conversationId: conversationParticipants.conversationId })
        .from(conversationParticipants)
        .where(eq(conversationParticipants.userId, userId));

      const conversationIds = existingConversations.map(c => c.conversationId);

      if (conversationIds.length > 0) {
        const sharedConversation = await db
          .select({ conversationId: conversationParticipants.conversationId })
          .from(conversationParticipants)
          .where(
            and(
              eq(conversationParticipants.userId, recipientId),
              inArray(conversationParticipants.conversationId, conversationIds)
            )
          )
          .limit(1);

        if (sharedConversation.length > 0) {
          const [conversation] = await db
            .select()
            .from(conversations)
            .where(eq(conversations.id, sharedConversation[0].conversationId));

          return res.json(conversation);
        }
      }

      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({ isGroup: false })
        .returning();

      // Add participants
      await db.insert(conversationParticipants).values([
        { conversationId: newConversation.id, userId: userId },
        { conversationId: newConversation.id, userId: recipientId },
      ]);

      res.json(newConversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get messages for a conversation with pagination
  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const conversationId = parseInt(req.params.conversationId);
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50; // Default 50 messages
      const before = req.query.before ? parseInt(req.query.before as string) : undefined; // Message ID to load before

      // Verify user is part of the conversation
      const [participant] = await db
        .select()
        .from(conversationParticipants)
        .where(
          and(
            eq(conversationParticipants.conversationId, conversationId),
            eq(conversationParticipants.userId, userId)
          )
        );

      if (!participant) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get messages with sender information and pagination
      let query = db
        .select({
          message: messages,
          sender: users,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(
          before
            ? and(
                eq(messages.conversationId, conversationId),
                lt(messages.id, before)
              )
            : eq(messages.conversationId, conversationId)
        )
        .orderBy(desc(messages.createdAt))
        .limit(limit);

      const conversationMessages = await query;

      const formattedMessages = conversationMessages
        .map(({ message, sender }) => ({
          ...message,
          sender: {
            id: sender.id,
            username: sender.username,
            fullName: sender.fullName,
            avatar: sender.avatar,
          },
        }))
        .reverse(); // Reverse to get chronological order

      res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get all users (for starting new conversations)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          avatar: users.avatar,
        })
        .from(users)
        .where(ne(users.id, userId));

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user's public key
  app.get("/api/users/:userId/public-key", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = parseInt(req.params.userId);
      const [user] = await db
        .select({ identityPublicKey: users.identityPublicKey })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ publicKey: user.identityPublicKey });
    } catch (error) {
      console.error("Error fetching public key:", error);
      res.status(500).json({ message: "Failed to fetch public key" });
    }
  });

  // Set user's public key (called once after registration)
  app.post("/api/user/public-key", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        console.log("⚠️ Public key upload failed: User not authenticated");
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;
      const { publicKey } = req.body;

      if (!publicKey) {
        console.log(`⚠️ Public key upload failed for user ${userId}: No public key provided`);
        return res.status(400).json({ message: "Public key is required" });
      }

      console.log(`📝 Updating public key for user ${userId}...`);
      
      await db
        .update(users)
        .set({ identityPublicKey: publicKey })
        .where(eq(users.id, userId));

      console.log(`✅ Public key uploaded successfully for user ${userId}`);
      res.json({ message: "Public key set successfully" });
    } catch (error) {
      console.error(`❌ Error setting public key for user ${req.user?.id}:`, error);
      res.status(500).json({ message: "Failed to set public key" });
    }
  });

  // Debug endpoint to check user's public key status
  app.get("/api/user/public-key/status", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;
      const [user] = await db
        .select({ 
          id: users.id, 
          username: users.username,
          identityPublicKey: users.identityPublicKey 
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      res.json({ 
        userId: user.id,
        username: user.username,
        hasPublicKey: !!user.identityPublicKey,
        publicKeyLength: user.identityPublicKey?.length || 0
      });
    } catch (error) {
      console.error("Error checking public key status:", error);
      res.status(500).json({ message: "Failed to check public key status" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user!.id;
      const { username, fullName, email, gender, avatar } = req.body;

      // Check if username is already taken by another user
      if (username && username !== req.user!.username) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.username, username));

        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      // Update user profile
      const [updatedUser] = await db
        .update(users)
        .set({
          username: username || req.user!.username,
          fullName,
          email,
          gender,
          avatar,
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          gender: users.gender,
          avatar: users.avatar,
        });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new IOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : "*",
      credentials: true,
    },
  });

  setupSocket(io);

  return httpServer;
}
