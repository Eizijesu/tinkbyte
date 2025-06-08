import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: 'http://localhost:4001/graphql', token: '48de3167e7dc82f017ef5d6d52efd6cd94815b80', queries,  });
export default client;
  