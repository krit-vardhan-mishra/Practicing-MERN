import { Server as IOServer, Socket } from "socket.io";
import { db } from "./db";
import { messages, conversationParticipants } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface SocketWithUser extends Socket {
  userId?: number;
}

// Track online users
const onlineUsers = new Set<number>();

/**
 * Socket.IO setup with encrypted message handling.
 * The server only stores and relays ciphertext—it never decrypts.
 */
export function setupSocket(io: IOServer) {
  io.on("connection", (socket: SocketWithUser) => {
    console.log("User connected:", socket.id);
    
    // Auto-authenticate from socket auth
    const userId = (socket.handshake.auth as any).userId;
    if (userId) {
      socket.userId = userId;
      socket.join(`user:${userId}`);
      onlineUsers.add(userId);
      // Notify all clients about user coming online
      io.emit("user_online", { userId });
      // Send current online users to the newly connected user
      socket.emit("online_users", Array.from(onlineUsers));
      console.log(`User ${userId} authenticated on connection`);
    }

    // Step 1: authenticate socket connection (backup)
    socket.on("authenticate", (userId: number) => {
      socket.userId = userId;
      socket.join(`user:${userId}`);
      onlineUsers.add(userId);
      // Notify all clients about user coming online
      io.emit("user_online", { userId });
      // Send current online users to the newly connected user
      socket.emit("online_users", Array.from(onlineUsers));
      console.log(`User ${userId} authenticated and joined personal room`);
    });

    // Step 2: join conversation
    socket.on("join_conversation", async (conversationId: number) => {
      try {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const [participant] = await db
          .select()
          .from(conversationParticipants)
          .where(
            and(
              eq(conversationParticipants.conversationId, conversationId),
              eq(conversationParticipants.userId, socket.userId)
            )
          );

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

    // Step 3: leave conversation
    socket.on("leave_conversation", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Step 4: send message (just relay encrypted data)
    socket.on("send_message", async (data: {
      conversationId: number;
      content: string;
    }) => {
      try {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const { conversationId, content } = data;

        // Confirm sender is part of conversation
        const [participant] = await db
          .select()
          .from(conversationParticipants)
          .where(
            and(
              eq(conversationParticipants.conversationId, conversationId),
              eq(conversationParticipants.userId, socket.userId)
            )
          );

        if (!participant) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Store message
        const [newMessage] = await db
          .insert(messages)
          .values({
            conversationId,
            senderId: socket.userId,
            content,
            delivered: true,
          })
          .returning();

        // Broadcast message to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit("new_message", {
          id: newMessage.id,
          conversationId,
          senderId: socket.userId,
          content,
          delivered: true,
          read: false,
          createdAt: newMessage.createdAt,
        });

        console.log(
          `Message sent in conversation ${conversationId} by user ${socket.userId}`
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator (unchanged)
    socket.on("typing", (data: { conversationId: number; isTyping: boolean }) => {
      if (!socket.userId) return;

      socket.to(`conversation:${data.conversationId}`).emit("user_typing", {
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });

    // ========== WebRTC signaling events ==========
    // Map: forward events to a specific user's personal room: `user:${id}`
    // Client emits with a target `toUserId`, server relays and annotates with `fromUserId`.

    // Initiate a call by sending an SDP offer to the callee
    socket.on(
      "call_user",
      (payload: {
        toUserId: number;
        offer: RTCSessionDescriptionInit;
        media: { audio: boolean; video: boolean };
      }) => {
        try {
          if (!socket.userId) return socket.emit("error", { message: "Not authenticated" });
          const { toUserId, offer, media } = payload;
          console.log("[signaling] call_user", { fromUserId: socket.userId, toUserId, media, hasSdp: !!offer?.type });
          io.to(`user:${toUserId}`).emit("incoming_call", {
            fromUserId: socket.userId,
            offer,
            media,
          });
        } catch (err) {
          console.error("call_user error:", err);
          socket.emit("error", { message: "Failed to initiate call" });
        }
      }
    );

    // Callee answers with SDP answer
    socket.on(
      "answer_call",
      (payload: { toUserId: number; answer: RTCSessionDescriptionInit }) => {
        try {
          if (!socket.userId) return socket.emit("error", { message: "Not authenticated" });
          const { toUserId, answer } = payload;
          console.log("[signaling] answer_call", { fromUserId: socket.userId, toUserId, hasSdp: !!answer?.type });
          io.to(`user:${toUserId}`).emit("call_answer", {
            fromUserId: socket.userId,
            answer,
          });
        } catch (err) {
          console.error("answer_call error:", err);
          socket.emit("error", { message: "Failed to answer call" });
        }
      }
    );

    // Optional: callee rejects call
    socket.on("reject_call", (payload: { toUserId: number; reason?: string }) => {
      try {
        if (!socket.userId) return socket.emit("error", { message: "Not authenticated" });
        const { toUserId, reason } = payload;
        console.log("[signaling] reject_call", { fromUserId: socket.userId, toUserId, reason });
        io.to(`user:${toUserId}`).emit("call_rejected", {
          fromUserId: socket.userId,
          reason,
        });
      } catch (err) {
        console.error("reject_call error:", err);
      }
    });

    // Exchange ICE candidates
    socket.on(
      "ice_candidate",
      (payload: { toUserId: number; candidate: RTCIceCandidateInit }) => {
        try {
          if (!socket.userId) return socket.emit("error", { message: "Not authenticated" });
          const { toUserId, candidate } = payload;
          console.log("[signaling] ice_candidate", { fromUserId: socket.userId, toUserId, hasCandidate: !!candidate?.candidate });
          io.to(`user:${toUserId}`).emit("ice_candidate", {
            fromUserId: socket.userId,
            candidate,
          });
        } catch (err) {
          console.error("ice_candidate error:", err);
        }
      }
    );

    // End an ongoing call
    socket.on("end_call", (payload: { toUserId: number }) => {
      try {
        if (!socket.userId) return socket.emit("error", { message: "Not authenticated" });
        const { toUserId } = payload;
        console.log("[signaling] end_call", { fromUserId: socket.userId, toUserId });
        io.to(`user:${toUserId}`).emit("call_ended", {
          fromUserId: socket.userId,
        });
      } catch (err) {
        console.error("end_call error:", err);
      }
    });

    // Mark message as read
    socket.on("mark_as_read", async (data: { messageId: number }) => {
      try {
        if (!socket.userId) {
          socket.emit("error", { message: "Not authenticated" });
          return;
        }

        const { messageId } = data;

        // Update message read status
        const [updatedMessage] = await db
          .update(messages)
          .set({ read: true })
          .where(eq(messages.id, messageId))
          .returning();

        if (updatedMessage) {
          // Notify the sender that their message was read
          io.to(`user:${updatedMessage.senderId}`).emit("message_read", {
            messageId: updatedMessage.id,
          });

          console.log(
            `Message ${messageId} marked as read by user ${socket.userId}`
          );
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", { message: "Failed to mark message as read" });
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        // Notify all clients about user going offline
        io.emit("user_offline", { userId: socket.userId });
      }
      console.log("User disconnected:", socket.id);
    });
  });
}
