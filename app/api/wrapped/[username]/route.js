import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  const { username } = await params;
  
  console.log(`Fetching data for: ${username}`);
  
  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }
  
  try {
    // Get authentication token from cookies (if user is logged in)
    const cookieStore = await cookies();
    const token = cookieStore.get('github_token')?.value;
    
    // Setup headers with authentication if available
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'GitHub-Wrapped-App',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    
    if (!userRes.ok) {
      if (userRes.status === 404) {
        return NextResponse.json({ 
          error: `User "${username}" not found on GitHub. Please check the spelling.` 
        }, { status: 404 });
      }
      if (userRes.status === 403) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded. Please try again later or login with GitHub for higher limits.' 
        }, { status: 403 });
      }
      return NextResponse.json({ error: `GitHub API error: ${userRes.status}` }, { status: userRes.status });
    }
    
    const userData = await userRes.json();
    
    // Fetch user repos
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=50&sort=updated`, { headers });
    const repos = await reposRes.json();
    
    if (!Array.isArray(repos)) {
      return NextResponse.json({ error: 'Failed to fetch repos' }, { status: 500 });
    }
    
    // Calculate stats
    let totalCommits = 0;
    const commitsByHour = Array(24).fill(0);
    const languageCount = {};
    let totalStars = 0;
    
    // NEW: Monthly commits (Jan = 0, Dec = 11)
    const monthlyCommits = Array(12).fill(0);
    
    // Get commits from first 5 repos (to avoid rate limits)
    for (const repo of repos.slice(0, 5)) {
      try {
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
                const month = date.getMonth(); // 0-11 (Jan-Dec)
                commitsByHour[hour]++;
                monthlyCommits[month]++; // Add to monthly count
              }
            });
          }
        }
      } catch (err) {
        console.log(`Error fetching commits for ${repo.name}:`, err.message);
      }
      
      // Count languages
      if (repo.language) {
        languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      }
      
      // Count stars
      totalStars += repo.stargazers_count || 0;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Fetch PRs and Issues count (only if we have token, otherwise skip)
    let totalPRs = 0;
    let totalIssues = 0;
    
    if (token) {
      try {
        const prsRes = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:pr`, { headers });
        const prsData = await prsRes.json();
        totalPRs = prsData.total_count || 0;
      } catch (err) {
        console.log('Error fetching PRs:', err.message);
      }
      
      try {
        const issuesRes = await fetch(`https://api.github.com/search/issues?q=author:${username}+type:issue`, { headers });
        const issuesData = await issuesRes.json();
        totalIssues = issuesData.total_count || 0;
      } catch (err) {
        console.log('Error fetching issues:', err.message);
      }
    }
    
    // Calculate longest streak (simplified)
    let longestStreak = 0;
    if (totalCommits > 0) {
      longestStreak = Math.min(Math.floor(totalCommits / 10), 30);
    }
    
    // Find most active hour
    let mostActiveHour = 12;
    let maxCommits = 0;
    for (let i = 0; i < 24; i++) {
      if (commitsByHour[i] > maxCommits) {
        maxCommits = commitsByHour[i];
        mostActiveHour = i;
      }
    }
    
    // Determine vibe
    let vibe = "";
    if (mostActiveHour >= 5 && mostActiveHour < 12) vibe = "🌅 Early Bird";
    else if (mostActiveHour >= 12 && mostActiveHour < 17) vibe = "☀️ Day Coder";
    else if (mostActiveHour >= 17 && mostActiveHour < 22) vibe = "🌆 Evening Coder";
    else vibe = "🦉 Night Owl";
    
    // Get top 5 languages
    const topLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    
    // Get top 3 languages for separate display
    const top3Languages = topLanguages.slice(0, 3);
    
    // Month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Return response
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
        totalPRs: totalPRs,
        totalIssues: totalIssues,
        totalStars: totalStars,
      },
      languages: topLanguages,
      top3Languages: top3Languages,
      monthlyCommits: monthlyCommits,
      monthNames: monthNames,
      commitsByHour: commitsByHour,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data. Please try again.', 
      details: error.message 
    }, { status: 500 });
  }
}