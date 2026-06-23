/**
 * DocAIMind — Auth handlers
 *
 * Connects Supabase auth state to the UI and app state.
 */

import { state } from "../state";
import { dom } from "../dom";
import { renderDocuments, addMessage } from "../ui";
import {
  restoreSession,
  signInWithGoogle,
  signOut,
  onAuthStateChange,
  getUser,
} from "../services/supabase";
import { refreshDocuments } from "../handlers_init";

/** Map Supabase User to our AppUser */
function syncUserToState() {
  const supaUser = getUser();
  if (supaUser) {
    const meta = supaUser.user_metadata ?? {};
    state.user = {
      id: supaUser.id,
      email: supaUser.email ?? undefined,
      name: meta.full_name ?? meta.name ?? supaUser.email ?? undefined,
      avatarUrl: meta.avatar_url ?? undefined,
    };
  } else {
    state.user = null;
  }
}

/** Update DOM to reflect auth state. */
function renderAuth() {
  const loggedOut = dom.authLoggedOut;
  const loggedIn = dom.authLoggedIn;
  const avatar = dom.userAvatar as HTMLImageElement;
  const nameEl = dom.userName;
  const emailEl = dom.userEmail;

  if (state.user) {
    loggedOut.classList.add("hidden");
    loggedIn.classList.remove("hidden");
    nameEl.textContent = state.user.name ?? "User";
    emailEl.textContent = state.user.email ?? "";
    avatar.src =
      state.user.avatarUrl ??
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23333'/><text x='50' y='65' text-anchor='middle' fill='%23fff' font-size='40'>👤</text></svg>";
    dom.questionInput.disabled = false;
    dom.sendButton.disabled = false;
  } else {
    loggedOut.classList.remove("hidden");
    loggedIn.classList.add("hidden");
    dom.questionInput.disabled = true;
    dom.sendButton.disabled = true;
  }
}

/** Initialise auth — restore session, wire up listeners, sync state. */
export async function initAuth(): Promise<void> {
  // Restore existing session
  await restoreSession();
  syncUserToState();
  state.isAuthReady = true;
  renderAuth();

  // If user is already logged in, fetch their docs
  if (state.user) {
    try {
      await refreshDocuments();
    } catch (e) {
      console.error("Failed to fetch docs after auth restore:", e);
    }
  }

  // Wire up login button
  dom.googleLoginBtn.addEventListener("click", async () => {
    dom.googleLoginBtn.disabled = true;
    dom.googleLoginBtn.textContent = "Redirecting to Google...";
    try {
      await signInWithGoogle();
    } catch (e) {
      dom.googleLoginBtn.disabled = false;
      dom.googleLoginBtn.textContent = "Sign in with Google";
      const msg = e instanceof Error ? e.message : "Sign-in failed";
      console.error("Google sign-in failed:", msg);
      if (
        msg.includes("provider is not enabled") ||
        msg.includes("Unsupported provider")
      ) {
        addMessage(
          "Google sign-in is not configured yet. Ask the developer to enable Google Auth in Supabase Dashboard → Authentication → Providers → Google.",
          "error",
        );
      }
    }
  });

  // Wire up logout button
  dom.logoutBtn.addEventListener("click", async () => {
    try {
      await signOut();
      state.documents = [];
      state.selectedDocumentIds.clear();
      state.accumulatedUsage = { totalTokens: 0, totalCost: 0 };
      state.questionCount = 0;
      syncUserToState();
      renderAuth();
      renderDocuments();
    } catch (e) {
      console.error("Sign-out failed:", e);
    }
  });

  // Listen for auth state changes (OAuth redirect, cross-tab)
  onAuthStateChange((user) => {
    syncUserToState();
    renderAuth();
    if (user) {
      refreshDocuments().catch(console.error);
    } else {
      state.documents = [];
      state.selectedDocumentIds.clear();
      renderDocuments();
    }
  });
}
