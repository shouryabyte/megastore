export function authErrorMessage(err: any, fallback: string) {
  const code = err?.response?.data?.error?.code as string | undefined;
  const serverMsg = err?.response?.data?.error?.message as string | undefined;

  if (code === "ACCOUNT_NOT_FOUND") return "Account doesn’t exist. Create an account to continue.";
  if (code === "INVALID_PASSWORD") return "Incorrect password. Please try again.";
  if (code === "EMAIL_IN_USE") return "An account with this email already exists. Try signing in instead.";
  if (code === "BLOCKED") return "Your account is blocked. Contact support.";

  return serverMsg || fallback;
}

