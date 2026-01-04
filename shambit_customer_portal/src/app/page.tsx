'use client';

import Link from 'next/link';

export default function Home() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Shambit Customer Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your customer portal. Please sign in or sign up to continue.
          </p>
          <div className="flex flex-col gap-4">
            <Link href="/auth" className="px-4 py-2 bg-blue-500 text-white rounded text-center">
              Sign In / Sign Up
            </Link>
            <Link href="/account" className="px-4 py-2 bg-green-500 text-white rounded text-center">
              Account Settings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
