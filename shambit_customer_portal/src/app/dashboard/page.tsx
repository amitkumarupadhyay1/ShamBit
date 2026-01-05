'use client';

import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth();
  const { isAuthenticated } = useRequireAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // useRequireAuth will handle redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              <button
                onClick={handleSignOut}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Profile Information
                </h3>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {user.name}
                  </p>
                  {user.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Phone:</span> {user.phone}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Role:</span> {user.roles}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email Verified:</span>{' '}
                    <span className={user.isEmailVerified ? 'text-green-600' : 'text-red-600'}>
                      {user.isEmailVerified ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Account Status
                </h3>
                <div className="mt-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Active Account</p>
                      <p className="text-sm text-gray-500">Your account is active and ready to use</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quick Actions
                </h3>
                <div className="mt-4 space-y-3">
                  <button className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">Browse Products</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">View Orders</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                    <span className="text-sm font-medium text-gray-900">Update Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity to display</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}