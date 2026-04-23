import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/github/callback`;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,repo`;
  
  console.log('Redirecting to GitHub OAuth...');
  return NextResponse.redirect(githubAuthUrl);
}