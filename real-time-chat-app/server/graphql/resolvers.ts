import { db } from "../db";
import { users } from "@shared/schema";
import { ilike, or, ne, and } from "drizzle-orm";

interface Context {
  userId?: number;
}

export const resolvers = {
  Query: {
    // Search users by username only (optimized for performance)
    searchUsers: async (_: any, { query }: { query: string }, context: Context) => {
      if (!context.userId) {
        throw new Error("Not authenticated");
      }

      // Search pattern for partial matching (optimized to search username only)
      const searchPattern = `%${query}%`;

      // Search users by username only, excluding the current user
      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          avatar: users.avatar,
        })
        .from(users)
        .where(
          and(
            ne(users.id, context.userId),
            ilike(users.username, searchPattern)
          )
        )
        .limit(15); // Limit results to 15 users for better performance

      return searchResults;
    },

    // Get a specific user by ID
    getUser: async (_: any, { id }: { id: number }, context: Context) => {
      if (!context.userId) {
        throw new Error("Not authenticated");
      }

      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          fullName: users.fullName,
          email: users.email,
          avatar: users.avatar,
        })
        .from(users)
        .where(ne(users.id, id))
        .limit(1);

      return user || null;
    },
  },
};
