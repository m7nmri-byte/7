"use client";

import { AuthCard, useSession } from "./components/AuthGate";
import { NashatApp } from "./App";

export default function Nashat() {
  const { session, checking } = useSession();

  if (checking) {
    return (
      <div
        aria-hidden
        className="h-72 animate-pulse rounded-2xl border border-edge bg-card"
      />
    );
  }

  if (!session) return <AuthCard />;

  return <NashatApp session={session} />;
}
