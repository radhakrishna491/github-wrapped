import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Await the cookies() promise first
    const cookieStore = await cookies();
    const token = cookieStore.get('github_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Fetch user data from GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.status === 401) {
      return NextResponse.json({ error: 'Token expired. Please login again.' }, { status: 401 });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}