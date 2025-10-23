const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const fs = require('fs');

const typeDefs = fs.readFileSync('./schema.graphql', 'utf8');

const books = [
    { id: '1', title: '1984', author: 'George Orwell', publishedYear: 2002, price: 200.3, inStock: true },
    { id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee', publishedYear: 2003, price: 150.0, inStock: false },
    { id: '3', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publishedYear: 2004, price: 180.5, inStock: true },
    { id: '4', title: 'The Game of the Thrones', author: 'George R.R. Martin', publishedYear: 2005, price: 250.0, inStock: false },
];

const users = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
    { id: '3', name: 'Charlie', email: 'charlie@example.com' },
    { id: '4', name: 'David', email: 'david@example.com' },
];

const resolvers = {
    Query: {
        hello: () => 'Hello from GraphQL...!',
        bello: () => 'Bello from GraphQL...!',
        books: () => books,
        users: () => users,
        book: (parent, { id }) => books.find(book => book.id === id),
        user: (parent, { id }) => users.find(user => user.id === id),
    },
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, {
    listen: { port: 4000 },
}).then(() => {
    console.log(`Server is running at http://localhost:4000/ at ${new Date().toLocaleTimeString()}`);
});