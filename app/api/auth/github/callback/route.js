import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: code,
    }),
  });
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  
  // Create response
  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  
  // ✅ Set cookie (this part is synchronous and fine)
  response.cookies.set('github_token', accessToken, { 
    httpOnly: true, 
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  
  return response;
}