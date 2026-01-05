'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

interface StatusCheck {
  name: string;
  status: 'checking' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function StatusPage() {
  const [checks, setChecks] = useState<StatusCheck[]>([
    { name: 'Customer Portal', status: 'checking', message: 'Checking...' },
    { name: 'NestJS API Health', status: 'checking', message: 'Checking...' },
    { name: 'Better Auth Endpoints', status: 'checking', message: 'Checking...' },
  ]);

  useEffect(() => {
    runStatusChecks();
  }, []);

  const runStatusChecks = async () => {
    // Check 1: Customer Portal (always success if we're here)
    updateCheck(0, 'success', 'Customer Portal is running');

    // Check 2: NestJS API Health
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        updateCheck(1, 'success', 'NestJS API is healthy', data);
      } else {
        updateCheck(1, 'error', `API returned ${response.status}`);
      }
    } catch (error: any) {
      updateCheck(1, 'error', `Cannot connect to API: ${error.message}`);
    }

    // Check 3: Better Auth Endpoints
    try {
      // Try to access the session endpoint (should return 401 if not authenticated)
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/session`);
      if (response.status === 401) {
        updateCheck(2, 'success', 'Better Auth endpoints are accessible (401 expected)');
      } else if (response.ok) {
        updateCheck(2, 'success', 'Better Auth endpoints are accessible');
      } else {
        updateCheck(2, 'error', `Auth endpoint returned ${response.status}`);
      }
    } catch (error: any) {
      updateCheck(2, 'error', `Cannot connect to auth endpoints: ${error.message}`);
    }
  };

  const updateCheck = (index: number, status: StatusCheck['status'], message: string, details?: any) => {
    setChecks(prev => prev.map((check, i) => 
      i === index ? { ...check, status, message, details } : check
    ));
  };

  const getStatusIcon = (status: StatusCheck['status']) => {
    switch (status) {
      case 'checking':
        return <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>;
      case 'success':
        return <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'error':
        return <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">System Status</h1>
            
            <div className="space-y-4">
              {checks.map((check, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{check.name}</h3>
                    <p className={`text-sm mt-1 ${
                      check.status === 'success' ? 'text-green-600' :
                      check.status === 'error' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {check.message}
                    </p>
                    {check.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                        <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded overflow-auto">
                          {JSON.stringify(check.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Environment Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">API URL:</span>
                  <span className="ml-2 text-gray-600">{process.env.NEXT_PUBLIC_API_URL}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Auth URL:</span>
                  <span className="ml-2 text-gray-600">{process.env.NEXT_PUBLIC_AUTH_URL}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={runStatusChecks}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh Status
              </button>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}