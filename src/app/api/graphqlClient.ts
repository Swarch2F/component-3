import { GraphQLClient } from 'graphql-request';

// Cambia esta URL por la de tu backend GraphQL
const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:9000/graphql';

export const graphQLClient = new GraphQLClient(endpoint, {
  headers: {
    // Puedes agregar headers personalizados aquí si es necesario
  },
});
