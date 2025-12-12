import { createSignal, onMount, Show, type Component } from "solid-js";
import { PasswordGate } from "@components/PasswordGate";
import { ChatWindow } from "@components/ChatWindow";

export const App: Component = () => {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    // Check if session cookie exists by making a lightweight request
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      setIsAuthenticated(response.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  });

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Show when={!isLoading()} fallback={<LoadingSpinner />}>
        <Show
          when={isAuthenticated()}
          fallback={<PasswordGate onSuccess={() => setIsAuthenticated(true)} />}
        >
          <ChatWindow onLogout={handleLogout} />
        </Show>
      </Show>
    </div>
  );
};

const LoadingSpinner: Component = () => (
  <div class="flex items-center justify-center min-h-screen">
    <div class="i-carbon-loading animate-spin text-4xl text-blue-600" />
  </div>
);
