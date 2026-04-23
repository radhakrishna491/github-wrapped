'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setError('No username provided');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Fetch user data
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) throw new Error('User not found');
        const userData = await userRes.json();
        setUser(userData);

        // Fetch wrapped stats
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading GitHub Wrapped...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <div className="bg-red-500/20 rounded-2xl p-8 text-center">
          <p className="text-red-300 text-xl">❌ {error}</p>
          <a href="/" className="text-purple-300 mt-4 inline-block">← Go Back</a>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* User Profile Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-6 flex-wrap">
            <img 
              src={user.avatar_url} 
              alt={user.name || user.login} 
              className="w-24 h-24 rounded-full border-4 border-purple-500"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name || user.login}</h1>
              <p className="text-gray-300">@{user.login}</p>
              {user.location && <p className="text-gray-400 mt-2">📍 {user.location}</p>}
              {user.created_at && <p className="text-gray-400">📅 Joined: {user.created_at.split('T')[0]}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{user.followers}</p>
              <p className="text-gray-400 text-sm">Followers</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{user.following}</p>
              <p className="text-gray-400 text-sm">Following</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{user.public_repos}</p>
              <p className="text-gray-400 text-sm">Public Repos</p>
            </div>
          </div>
        </div>

        {/* GitHub Wrapped Stats */}
        {stats && stats.stats && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white text-center mb-6">📊 GitHub Wrapped</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-purple-400">{stats.stats.totalCommits}</p>
                <p className="text-gray-300 mt-2">Total Commits</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-4xl font-bold text-purple-400">{stats.stats.totalRepos}</p>
                <p className="text-gray-300 mt-2">Repositories</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <div className="text-5xl mb-2">{stats.stats.vibe?.split(' ')[0] || '🦉'}</div>
                <p className="text-gray-300">{stats.stats.vibe || 'Coding Vibe'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 text-center">
                <p className="text-2xl font-bold text-purple-400">{stats.stats.mostActiveHour}:00</p>
                <p className="text-gray-300 mt-2">Most Active Hour</p>
              </div>
            </div>

            {/* Top Languages */}
            {stats.languages && stats.languages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white mb-4">🏆 Top Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.languages.map((lang, i) => (
                    <span key={i} className="bg-purple-600/50 px-4 py-2 rounded-full text-white">
                      {lang.name} ({lang.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}