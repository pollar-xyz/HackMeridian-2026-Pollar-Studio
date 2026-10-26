// What client components see of the signed-in user. The tokens stay in the
// session cookie, which only the server reads.
export interface SessionProfile {
  id: string;
  mail: string;
  first_name: string;
  last_name: string;
  avatar: string;
  role?: string;
}
