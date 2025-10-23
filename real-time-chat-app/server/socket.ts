import { Server as IOServer, Socket } from "socket.io";
import { db } from "./db";
import { messages, conversationParticipants } from "@shared/schema";
import { eq } from "drizzle-orm";

interface SocketWithUser extends Socket {
  userId?: number;
}

export function setupSocket(io: IOServer) {
  io.on("connection", (socket: SocketWithUser) => {
    console.log("User connected:", socket.id);

    // Join user to their personal room
    socket.on("authenticate", (userId: number) => {
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated and joined room`);
    });

    // Join a conversation room
    socket.on("join_conversation", async (conversationId: number) => {
      try {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        // Verify user is part of the conversation
        const [participant] = await db
          .select()
          .from(conversationParticipants)
          .where(eq(conversationParticipants.conversationId, conversationId))
          .where(eq(conversationParticipants.userId, socket.userId));

        if (!participant) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Leave a conversation room
    socket.on("leave_conversation", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Send a message
    socket.on("send_message", async (data: { conversationId: number; content: string }) => {
      try {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const { conversationId, content } = data;

        // Verify user is part of the conversation
        const [participant] = await db
          .select()
          .from(conversationParticipants)
          .where(eq(conversationParticipants.conversationId, conversationId))
          .where(eq(conversationParticipants.userId, socket.userId));

        if (!participant) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Save message to database
        const [newMessage] = await db
          .insert(messages)
          .values({
            conversationId,
            senderId: socket.userId,
            content,
            delivered: true,
          })
          .returning();

        // Broadcast message to all users in the conversation
        io.to(`conversation:${conversationId}`).emit("new_message", {
          ...newMessage,
          sender: {
            id: socket.userId,
          },
        });

        console.log(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // User is typing
    socket.on("typing", (data: { conversationId: number; isTyping: boolean }) => {
      if (!socket.userId) return;

      socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}
