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
  insertConversationSchema,
  insertMessageSchema 
} from "@shared/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";

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

  // Get messages for a conversation
  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const conversationId = parseInt(req.params.conversationId);
      const userId = req.user!.id;

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

      // Get messages with sender information
      const conversationMessages = await db
        .select({
          message: messages,
          sender: users,
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);

      const formattedMessages = conversationMessages.map(({ message, sender }) => ({
        ...message,
        sender: {
          id: sender.id,
          username: sender.username,
          fullName: sender.fullName,
          avatar: sender.avatar,
        },
      }));

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
        .where(eq(users.id, userId).not());

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
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
