import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface GetUsersData {
  users: User[];
}

const GET_USERS = gql`
query {
  users {
    id
    name
    email
  }
}
`;

function Users() {
  const { data, loading, error } = useQuery<GetUsersData>(GET_USERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul style={{ padding: 0, textAlign: 'left' }}>
      {data?.users.map((user: User) => (
        <li key={user.id} style={{ marginBottom: '10px', padding: '10px' }}>
          <strong>{user.name}</strong> - {user.email}
        </li>
      ))}
    </ul>
  );
}

export default Users;
