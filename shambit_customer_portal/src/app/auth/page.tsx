'use client';

import { signIn } from "next-auth/react";

export default function Auth() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <h1>Sign In</h1>
      <button onClick={() => signIn()}>Sign In</button>
    </div>
  );
}
