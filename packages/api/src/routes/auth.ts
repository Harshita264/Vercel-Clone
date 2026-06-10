import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { signToken, verifyToken, requireAuth } from '../lib/auth';

export const authRouter = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:5173';

// Step 1 — redirect user to GitHub
authRouter.get('/github', (req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'read:user user:email repo',
    redirect_uri: `http://localhost:3001/auth/github/callback`,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GET /auth/repos — list user's GitHub repos
authRouter.get('/repos', requireAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;

  const reposRes = await fetch(
    'https://api.github.com/user/repos?sort=updated&per_page=30',
    {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  const repos = await reposRes.json() as Array<{
    id: number;
    name: string;
    full_name: string;
    clone_url: string;
    private: boolean;
    updated_at: string;
  }>;

  res.json(repos.map(r => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    cloneUrl: r.clone_url,
    private: r.private,
    updatedAt: r.updated_at,
  })));
});

// Step 2 — GitHub redirects back here with a code
authRouter.get('/github/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    res.redirect(`${DASHBOARD_URL}?error=missing_code`);
    return;
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token: string; error?: string };
    console.log('Github token response:', tokenData);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      res.redirect(`${DASHBOARD_URL}?error=no_token`);
      return;
    }

    // Fetch GitHub user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userRes.json() as {
      id: number;
      login: string;
      email: string | null;
      avatar_url: string;
    };

    // Upsert user in DB
    const user = await prisma.user.upsert({
      where: { githubId: String(githubUser.id) },
      update: {
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        accessToken,
      },
      create: {
        githubId: String(githubUser.id),
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        accessToken,
      },
    });

    // Issue JWT as a cookie
    const token = signToken({
      userId: user.id,
      githubId: user.githubId,
      username: user.username,
    });

    res.cookie('token', token, {
      httpOnly: false,   // allow JS to read it since we can't share httpOnly cross-port
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`http://localhost:5173/dashboard?token=${token}`);

  } catch (err) {
    console.error('OAuth error:', err);
    res.redirect(`${DASHBOARD_URL}?error=oauth_failed`);
  }
});

// GET /auth/me — returns current user
authRouter.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.token ||
  req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.json({ user: null });
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        githubId: true,
      },
    });
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

// POST /auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});