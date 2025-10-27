import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type User {
    id: Int!
    username: String!
    fullName: String
    email: String
    avatar: String
  }

  type Query {
    searchUsers(query: String!): [User!]!
    getUser(id: Int!): User
  }
`;
