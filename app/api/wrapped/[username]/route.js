import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';  // ← NEW: Import cookies

export async function GET(request, { params }) {
  const { username } = await params;
  
  console.log(`Fetching data for: ${username}`);
  
  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }
  
  try {
    // ✅ NEW: Get authentication token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('github_token')?.value;
    
    // ✅ NEW: Build headers with authentication
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'GitHub-Wrapped-App',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // ✅ CHANGED: Added headers to fetch
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    
    if (!userRes.ok) {
      if (userRes.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (userRes.status === 403) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please log in.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'GitHub API error' }, { status: userRes.status });
    }
    
    const userData = await userRes.json();
    
    // ✅ CHANGED: Added headers to repos fetch
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=50&sort=updated`, { headers });
    const repos = await reposRes.json();
    
    if (!Array.isArray(repos)) {
      return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 500 });
    }
    
    // Calculate stats
    let totalCommits = 0;
    const commitsByHour = Array(24).fill(0);
    const languageCount = {};
    
    // Get commits from first 5 repos
    for (const repo of repos.slice(0, 5)) {
      try {
        // ✅ CHANGED: Added headers to commits fetch
        const commitsRes = await fetch(
          `https://api.github.com/repos/${username}/${repo.name}/commits?per_page=100&author=${username}`,
          { headers }
        );
        
        if (commitsRes.ok) {
          const commits = await commitsRes.json();
          if (Array.isArray(commits)) {
            totalCommits += commits.length;
            
            commits.forEach(commit => {
              const date = new Date(commit.commit?.author?.date);
              if (date && !isNaN(date.getTime())) {
                const hour = date.getHours();
                commitsByHour[hour]++;
              }
            });
          }
        }
      } catch (err) {
        console.log(`Error fetching commits for ${repo.name}:`, err.message);
      }
      
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    let longestStreak = 0;
    if (totalCommits > 0) {
      longestStreak = Math.min(Math.floor(totalCommits / 10), 30);
    }
    
    let mostActiveHour = 12;
    let maxCommits = 0;
    for (let i = 0; i < 24; i++) {
      if (commitsByHour[i] > maxCommits) {
        maxCommits = commitsByHour[i];
        mostActiveHour = i;
      }
    }
    
    let vibe = "";
    if (mostActiveHour >= 5 && mostActiveHour < 12) vibe = "🌅 Early Bird";
    else if (mostActiveHour >= 12 && mostActiveHour < 17) vibe = "☀️ Day Coder";
    else if (mostActiveHour >= 17 && mostActiveHour < 22) vibe = "🌆 Evening Coder";
    else vibe = "🦉 Night Owl";
    
    const topLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    return NextResponse.json({
      user: {
        name: userData.name || userData.login,
        username: userData.login,
        avatar: userData.avatar_url,
        joinedDate: userData.created_at?.split('T')[0],
        location: userData.location || 'Not specified',
        followers: userData.followers,
        following: userData.following,
      },
      stats: {
        totalCommits: totalCommits,
        totalRepos: repos.length,
        longestStreak: longestStreak,
        mostActiveHour: mostActiveHour,
        vibe: vibe,
      },
      languages: topLanguages,
      commitsByHour: commitsByHour,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data', 
      details: error.message 
    }, { status: 500 });
  }
}