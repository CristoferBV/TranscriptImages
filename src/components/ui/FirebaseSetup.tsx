import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import Card from './Card';
import Button from './Button';

const FirebaseSetup: React.FC = () => {
  const missingEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ].filter(envVar => !import.meta.env[envVar] || import.meta.env[envVar].includes('demo') || import.meta.env[envVar].includes('your-'));

  if (missingEnvVars.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Firebase Configuration Required
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            To use this application, you need to set up Firebase and configure your environment variables.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h4 className="font-medium text-gray-900 mb-2">Missing Configuration:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {missingEnvVars.map(envVar => (
                <li key={envVar} className="font-mono">
                  {envVar}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.open('https://console.firebase.google.com', '_blank')}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Firebase Console
            </Button>
            
            <div className="text-xs text-gray-500">
              <p>1. Create a Firebase project</p>
              <p>2. Enable Authentication, Firestore, and Storage</p>
              <p>3. Copy your config to the .env file</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FirebaseSetup;