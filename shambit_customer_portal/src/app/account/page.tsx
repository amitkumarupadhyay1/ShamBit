'use client';

import { useSession, signOut } from "next-auth/react";

export default function Account() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (!session) return <div>Not signed in</div>;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: '1rem',
      }}
    >
      <h1>Account</h1>
      <p>Welcome, {session.user?.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
