import { Router, Request, Response } from 'express';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { firebaseApp } from '../index';

const router = Router();

let auth: any = null;
try {
  auth = getAuth(firebaseApp);
} catch (error: any) {
  console.warn('[Firebase Auth] Initialization failed. Auth endpoints will not be available:', error.message);
}

function checkAuth(req: Request, res: Response, next: () => void) {
  if (!auth) {
    return res.status(500).json({ error: 'Authentication service not initialized. Check server environment variables.' });
  }
  next();
}

// POST /api/auth/signup
router.post('/signup', checkAuth, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: user.uid,
        email: user.email,
      },
      token
    });
  } catch (error: any) {
    console.error('[Auth Signup Error]:', error);
    return res.status(error.status || 400).json({
      error: error.message || 'Signup failed',
      code: error.code || 'auth/unknown-error'
    });
  }
});

// POST /api/auth/login
router.post('/login', checkAuth, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const token = await user.getIdToken();

    return res.json({
      message: 'User authenticated successfully',
      user: {
        uid: user.uid,
        email: user.email,
      },
      token
    });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    return res.status(error.status || 400).json({
      error: error.message || 'Authentication failed',
      code: error.code || 'auth/unknown-error'
    });
  }
});

// GET /api/auth/me
// Since we are proxying, we can check client's idToken.
// Note: We can decode/verify or get user details.
// A simple verification is to check if headers have Authorization: Bearer <token>.
// We can use Firebase's getIdTokenResult or similar, or just check the current auth state or verify it.
router.get('/me', checkAuth, async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Check current state or verify token.
    // Note: With client SDK in node, if auth.currentUser is set and matches the token,
    // we can use it. Otherwise, we can return the active current user if they are logged in.
    const currentUser = auth.currentUser;
    if (currentUser) {
      return res.json({
        user: {
          uid: currentUser.uid,
          email: currentUser.email
        }
      });
    } else {
      // If server session is stateless or recycled, but client has token, we can return status.
      // Firebase client SDK doesn't have local verification of third-party tokens easily,
      // but we can trust the token, or return OK. For high-fidelity, we can return a default success or look it up.
      // Let's check: if we want proper verification, we can query firebase REST endpoint for user data
      // using the provided ID token: https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=[API_KEY]
      const apiKey = process.env.FIREBASE_API_KEY;
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data: any = await response.json();
      if (data.users && data.users.length > 0) {
        const fbUser = data.users[0];
        return res.json({
          user: {
            uid: fbUser.localId,
            email: fbUser.email
          }
        });
      }
      return res.status(401).json({ error: 'Invalid token user profile' });
    }
  } catch (error: any) {
    console.error('[Auth Verify Token Error]:', error);
    return res.status(401).json({ error: 'Unauthorized session' });
  }
});

// POST /api/auth/logout
router.post('/logout', checkAuth, async (req: Request, res: Response) => {
  try {
    await firebaseSignOut(auth);
    return res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
