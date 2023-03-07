import { IncomingMessage, IncomingMessage } from "http";

declare module "http" {
  interface IncomingMessage {
    session: Session;
  }
}

export interface Session {
  user?: {
    id: string;
    email: string;
    username?: string;
  } & DefaultSession["user"];
  expires: Date;
}

export interface DefaultSession {
  user?: {
    email?: string | null;
    // add more properties here
  };
}

export interface AuthUser {
  id: string;
  email: string;
  password: string;
}
