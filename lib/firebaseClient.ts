// Client-only Firebase Auth wrapper to prevent SSR initialization
let clientAuth: any = null;
let clientFunctions: any = null;

export function getClientAuth() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!clientAuth) {
    // Dynamic import only on client
    const { auth } = require('@/lib/firebase');
    clientAuth = auth;
  }
  
  return clientAuth;
}

export function getFirebaseAuthFunctions() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!clientFunctions) {
    // Dynamic import only on client
    clientFunctions = require('firebase/auth');
  }
  
  return clientFunctions;
}
