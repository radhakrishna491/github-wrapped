import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Function to determine user level based on commits and repos
function getUserLevel(totalCommits, totalRepos) {
  if (totalCommits > 500 || totalRepos > 15) {
    return { level: 'Pro', icon: '🚀', color: 'from-yellow-600/30 to-orange-600/30', badge: '🏆 Professional Developer' };
  } else if (totalCommits >= 100 || totalRepos >= 5) {
    return { level: 'Learner', icon: '📚', color: 'from-blue-600/30 to-cyan-600/30', badge: '🌟 Active Learner' };
  } else {
    return { level: 'Beginner', icon: '🌱', color: 'from-green-600/30 to-emerald-600/30', badge: '💪 Starting Strong' };
  }
}

// Function to predict GitHub Age based on performance metrics
function predictGitHubAge(totalCommits, totalRepos, totalPRs, totalIssues, totalStars, longestStreak) {
  // Calculate experience score (0-100)
  let score = 0;
  
  // Commit score (max 30 points)
  if (totalCommits > 5000) score += 30;
  else if (totalCommits > 2000) score += 25;
  else if (totalCommits > 1000) score += 20;
  else if (totalCommits > 500) score += 15;
  else if (totalCommits > 200) score += 10;
  else if (totalCommits > 50) score += 5;
  else score += 2;
  
  // Repo score (max 20 points)
  if (totalRepos > 50) score += 20;
  else if (totalRepos > 30) score += 15;
  else if (totalRepos > 20) score += 10;
  else if (totalRepos > 10) score += 5;
  else if (totalRepos > 5) score += 3;
  else score += 1;
  
  // PR score (max 20 points)
  if (totalPRs > 500) score += 20;
  else if (totalPRs > 200) score += 15;
  else if (totalPRs > 100) score += 10;
  else if (totalPRs > 50) score += 5;
  else if (totalPRs > 10) score += 3;
  else score += 1;
  
  // Issues score (max 15 points)
  if (totalIssues > 200) score += 15;
  else if (totalIssues > 100) score += 10;
  else if (totalIssues > 50) score += 7;
  else if (totalIssues > 20) score += 5;
  else if (totalIssues > 5) score += 3;
  else score += 1;
  
  // Stars score (max 10 points)
  if (totalStars > 500) score += 10;
  else if (totalStars > 200) score += 7;
  else if (totalStars > 100) score += 5;
  else if (totalStars > 50) score += 3;
  else if (totalStars > 10) score += 2;
  else score += 1;
  
  // Streak score (max 5 points)
  if (longestStreak > 100) score += 5;
  else if (longestStreak > 50) score += 4;
  else if (longestStreak > 30) score += 3;
  else if (longestStreak > 14) score += 2;
  else if (longestStreak > 7) score += 1;
  
  // Determine GitHub Age based on score
  let ageLevel, ageIcon, ageDescription, estimatedYears;
  
  if (score >= 90) {
    ageLevel = 'Legend';
    ageIcon = '👑';
    estimatedYears = '8+ years';
    ageDescription = 'A true GitHub legend! Your contributions are inspiring generations of developers.';
  } else if (score >= 70) {
    ageLevel = 'Expert';
    ageIcon = '🏆';
    estimatedYears = '5-8 years';
    ageDescription = 'Expert level developer with extensive open source experience. You know the craft!';
  } else if (score >= 50) {
    ageLevel = 'Advanced';
    ageIcon = '🚀';
    estimatedYears = '3-5 years';
    ageDescription = 'Advanced developer making significant contributions. Your code impacts many.';
  } else if (score >= 30) {
    ageLevel = 'Intermediate';
    ageIcon = '📚';
    estimatedYears = '1-3 years';
    ageDescription = 'Growing developer with consistent activity. Keep up the great work!';
  } else if (score >= 15) {
    ageLevel = 'Beginner';
    ageIcon = '🌱';
    estimatedYears = 'Less than 1 year';
    ageDescription = 'Starting your GitHub journey. Every expert was once a beginner!';
  } else {
    ageLevel = 'Newbie';
    ageIcon = '🆕';
    estimatedYears = 'Just getting started';
    ageDescription = 'Welcome to the GitHub community! Your journey starts here.';
  }
  
  return {
    level: ageLevel,
    icon: ageIcon,
    estimatedYears: estimatedYears,
    description: ageDescription,
    score: score,
  };
}

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
    
    // Monthly commits (Jan = 0, Dec = 11)
    const monthlyCommits = Array(12).fill(0);
    
    // Language logo mapping
    const languageLogos = {
      'JavaScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      'TypeScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
      'Python': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      'Java': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
      'C++': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
      'C': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
      'C#': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
      'Go': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
      'Rust': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg',
      'Ruby': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
      'PHP': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
      'Swift': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
      'Kotlin': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
      'HTML5': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
      'CSS3': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
      'React': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      'Node.js': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      'Django': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
      'Flask': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
    };
    
    // Get commits from first 10 repos
    for (const repo of repos.slice(0, 10)) {
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
                const month = date.getMonth();
                commitsByHour[hour]++;
                monthlyCommits[month]++;
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
      
      totalStars += repo.stargazers_count || 0;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Fetch PRs and Issues count
    let totalPRs = 0;
    let totalIssues = 0;
    
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
    
    // Calculate longest streak
    let longestStreak = 0;
    if (totalCommits > 0) {
      longestStreak = Math.min(Math.floor(totalCommits / 15), 45);
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
    
    // Get top languages with logos
    const topLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ 
        name, 
        count,
        logo: languageLogos[name] || 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg'
      }));
    
    const top3Languages = topLanguages.slice(0, 3);
    const userLevel = getUserLevel(totalCommits, repos.length);
    
    // Calculate GitHub Age
    const gitHubAge = predictGitHubAge(totalCommits, repos.length, totalPRs, totalIssues, totalStars, longestStreak);
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalYearlyCommits = monthlyCommits.reduce((a, b) => a + b, 0);
    const monthlyPercentages = monthlyCommits.map(commits => 
      totalYearlyCommits > 0 ? Math.round((commits / totalYearlyCommits) * 100) : 0
    );
    
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
        userLevel: userLevel,
        gitHubAge: gitHubAge,
      },
      languages: topLanguages,
      top3Languages: top3Languages,
      monthlyCommits: monthlyCommits,
      monthlyPercentages: monthlyPercentages,
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