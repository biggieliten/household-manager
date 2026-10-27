import { HTTPException } from "hono/http-exception";
import { Prisma } from "../generated/prisma/client.ts";

// Prisma error codes the API answers as client errors, with a fallback message
const dbErrors = {
  P2002: { status: 409, message: "Already exists" }, // unique constraint violated
  P2003: { status: 404, message: "Related record not found" }, // foreign key violated
  P2025: { status: 404, message: "Not found" }, // record not found
} as const;

type DbErrorCode = keyof typeof dbErrors;

const isDbError = (
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError & { code: DbErrorCode } =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code in dbErrors;

// Rethrows mapped Prisma errors as HTTPExceptions with the route's own message
export const mapDbError =
  (messages: Partial<Record<DbErrorCode, string>>) =>
  (error: unknown): never => {
    if (isDbError(error)) {
      const message = messages[error.code];
      if (message) {
        throw new HTTPException(dbErrors[error.code].status, { message });
      }
    }
    throw error;
  };

// The fallback response for a Prisma error no route mapped itself
export const toDbErrorResponse = (error: unknown) =>
  isDbError(error) ? dbErrors[error.code] : null;
