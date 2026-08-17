import { redirect } from "next/navigation";

// Redirect old /settings/api-keys → /settings/tokens
export default function ApiKeysRedirect() {
  redirect("/settings/tokens");
}
