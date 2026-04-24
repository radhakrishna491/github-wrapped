'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import CountUp from 'react-countup';
import { toPng } from 'html-to-image';

// Dynamically import chart to avoid SSR issues
const YearlyProgressChart = dynamic(() => import('@/components/YearlyProgressChart'), { ssr: false });

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="w-24 h-24 rounded-full bg-white/20 animate-pulse"></div>
            <div className="flex-1">
              <div className="h-8 bg-white/20 rounded w-48 animate-pulse mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                <div className="h-8 bg-white/20 rounded w-16 mx-auto mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-20 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-6 animate-pulse"></div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/5 rounded-xl p-6 animate-pulse">
                <div className="h-12 bg-white/20 rounded w-24 mx-auto mb-2"></div>
                <div className="h-4 bg-white/20 rounded w-32 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dashboardRef = useRef(null);

  useEffect(() => {
    if (!username) {
      setError('No username provided');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) {
          if (userRes.status === 404) {
            throw new Error(`User "${username}" not found on GitHub`);
          }
          throw new Error('GitHub API error');
        }
        const userData = await userRes.json();
        setUser(userData);

        const statsRes = await fetch(`/api/wrapped/${username}`);
        const statsData = await statsRes.json();
        if (statsData.error) throw new Error(statsData.error);
        setStats(statsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  const handleDownload = async () => {
    if (dashboardRef.current) {
      try {
        const dataUrl = await toPng(dashboardRef.current, { quality: 0.95 });
        const link = document.createElement('a');
        link.download = `github-wrapped-${user?.login || username}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Error generating image:', err);
      }
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard! Share it with your friends.');
  };

  const handleTwitterShare = () => {
    const text = `Check out my GitHub Wrapped! I have ${stats?.stats?.totalCommits || 0} commits and I'm a ${stats?.stats?.gitHubAge?.level || 'Developer'}! 🚀`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-300 text-xl">❌ {error}</p>
          {username && (
            <p className="text-gray-300 mt-2">
              Username "<span className="text-purple-300">{username}</span>" not found on GitHub.
            </p>
          )}
          <p className="text-gray-400 text-sm mt-4">
            Make sure the username is spelled correctly and the GitHub account exists.
          </p>
          <Link href="/" className="text-purple-300 mt-6 inline-block hover:underline">← Go Back and Try Again</Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userLevel = stats?.stats?.userLevel || { level: 'Beginner', icon: '🌱', color: 'from-green-600/30 to-emerald-600/30', badge: 'Starting Strong' };
  const gitHubAge = stats?.stats?.gitHubAge || { level: 'Newbie', icon: '🆕', estimatedYears: 'Just getting started', description: 'Welcome to GitHub!', score: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-8">
      <div ref={dashboardRef} className="max-w-6xl mx-auto">
        
        {/* Header with Share Buttons */}
        <div className="flex justify-end gap-3 mb-6 flex-wrap">
          <button onClick={handleDownload} className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600 rounded-lg text-white text-sm transition-all duration-300 hover:scale-105">📸 Download</button>
          <button onClick={handleShare} className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600 rounded-lg text-white text-sm transition-all duration-300 hover:scale-105">🔗 Copy Link</button>
          <button onClick={handleTwitterShare} className="px-4 py-2 bg-sky-600/50 hover:bg-sky-600 rounded-lg text-white text-sm transition-all duration-300 hover:scale-105">🐦 Tweet</button>
        </div>

        {/* User Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl border border-white/20">
          <div className="flex items-center gap-6 flex-wrap">
            <img src={user.avatar_url} alt={user.name || user.login} className="w-24 h-24 rounded-full border-4 border-purple-500 transition-all duration-300 hover:scale-105 hover:border-pink-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name || user.login}</h1>
              <p className="text-gray-300">@{user.login}</p>
              {user.location && <p className="text-gray-400 mt-2">📍 {user.location}</p>}
              {user.created_at && <p className="text-gray-400">📅 Joined: {user.created_at.split('T')[0]}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8 text-center">
            <div className="bg-white/5 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:bg-white/10">
              <p className="text-3xl font-bold text-white"><CountUp end={user.followers} duration={2} /></p>
              <p className="text-gray-400 text-sm mt-1">Followers</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:bg-white/10">
              <p className="text-3xl font-bold text-white"><CountUp end={user.following} duration={2} /></p>
              <p className="text-gray-400 text-sm mt-1">Following</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:bg-white/10">
              <p className="text-3xl font-bold text-white"><CountUp end={user.public_repos} duration={2} /></p>
              <p className="text-gray-400 text-sm mt-1">Public Repos</p>
            </div>
            <div className={`bg-gradient-to-br ${userLevel.color} rounded-xl p-4 transition-all duration-300 hover:scale-105 border border-white/20`}>
              <div className="text-3xl mb-1">{userLevel.icon}</div>
              <p className="text-xl font-bold text-white">{userLevel.level}</p>
              <p className="text-gray-300 text-xs mt-1">{userLevel.badge}</p>
            </div>
          </div>
        </div>

        {/* GitHub Age Prediction Card */}
        {stats && stats.stats && stats.stats.gitHubAge && (
          <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 rounded-2xl p-6 mb-8 transition-all duration-300 hover:scale-[1.02] border border-indigo-500/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{gitHubAge.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white">GitHub Age Prediction</h3>
                  <p className="text-purple-300 text-sm">Based on your activity and contributions</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{gitHubAge.level}</div>
                <p className="text-gray-300 text-sm">Estimated: {gitHubAge.estimatedYears}</p>
              </div>
            </div>
            <p className="text-gray-300 mt-4 text-center">{gitHubAge.description}</p>
            <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${gitHubAge.score}%` }}
              />
            </div>
            <p className="text-gray-400 text-xs text-center mt-2">Experience Score: {gitHubAge.score}/100</p>
          </div>
        )}

        {/* GitHub Wrapped Stats */}
        {stats && stats.stats && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl border border-white/20">
            <h2 className="text-3xl font-bold text-white text-center mb-8">📊 GitHub Wrapped 2024</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 border border-purple-500/30">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-4xl font-bold text-white"><CountUp end={stats.stats.totalCommits} duration={2} /></p>
                <p className="text-gray-300 mt-2">Total Commits</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 border border-blue-500/30">
                <div className="text-5xl mb-3">📚</div>
                <p className="text-4xl font-bold text-white"><CountUp end={stats.stats.totalRepos} duration={2} /></p>
                <p className="text-gray-300 mt-2">Repositories</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600/30 to-red-600/30 rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 border border-orange-500/30">
                <div className="text-5xl mb-3">🔥</div>
                <p className="text-4xl font-bold text-white"><CountUp end={stats.stats.longestStreak} duration={2} /></p>
                <p className="text-gray-300 mt-2">Day Streak</p>
              </div>
              <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 border border-green-500/30">
                <div className="text-5xl mb-3">{stats.stats.vibe?.split(' ')[0] || '🦉'}</div>
                <p className="text-xl font-bold text-white">{stats.stats.vibe || 'Coding Vibe'}</p>
                <p className="text-gray-300 mt-2">Most Active: {stats.stats.mostActiveHour}:00</p>
              </div>
            </div>

            {/* Yearly Progress Pie Chart - Full Width */}
            <div className="mt-8 max-w-md mx-auto">
              <YearlyProgressChart 
                monthlyCommits={stats.monthlyCommits || Array(12).fill(0)} 
                monthNames={stats.monthNames || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                monthlyPercentages={stats.monthlyPercentages || Array(12).fill(0)}
              />
            </div>

            {/* Top 3 Languages with Logos */}
            {stats.top3Languages && stats.top3Languages.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">🏆 Top 3 Languages</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                  {stats.top3Languages.map((lang, i) => (
                    <div key={i} className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl border border-purple-500/30">
                      <img src={lang.logo} alt={lang.name} className="w-16 h-16 mx-auto mb-3" />
                      <p className="text-xl font-bold text-white">{lang.name}</p>
                      <p className="text-purple-300 text-sm mt-1">{lang.count} {lang.count === 1 ? 'repository' : 'repositories'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/5 rounded-xl p-4 text-center hover:scale-105 transition">
                <p className="text-2xl font-bold text-purple-400"><CountUp end={stats.stats.totalPRs || 0} duration={2} /></p>
                <p className="text-gray-400 text-sm">Pull Requests</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center hover:scale-105 transition">
                <p className="text-2xl font-bold text-purple-400"><CountUp end={stats.stats.totalIssues || 0} duration={2} /></p>
                <p className="text-gray-400 text-sm">Issues Opened</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center hover:scale-105 transition">
                <p className="text-2xl font-bold text-purple-400"><CountUp end={stats.stats.totalStars || 0} duration={2} /></p>
                <p className="text-gray-400 text-sm">Stars Received</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>Made with 🚀 for GitHub developers | Data from GitHub API</p>
        </div>
      </div>
    </div>
  );
}