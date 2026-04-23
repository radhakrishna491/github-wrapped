'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [viewingUsername, setViewingUsername] = useState(null);
  const [error, setError] = useState(null);

  // Fetch logged-in user info on page load
  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data.login) {
          setUser(data);
          fetchWrappedData(data.login);
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Function to fetch wrapped data for any username
  const fetchWrappedData = async (username) => {
    setLoading(true);
    setError(null);
    setViewingUsername(username);
    
    try {
      const response = await fetch(`/api/wrapped/${username}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchUsername.trim()) {
      fetchWrappedData(searchUsername.trim());
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading GitHub Wrapped...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with GitHub Logo - Removed subtitle line */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* GitHub Logo */}
            <svg 
              viewBox="0 0 24 24" 
              width="48" 
              height="48" 
              fill="white"
              className="inline-block"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.58 0-.287-.01-1.05-.015-2.06-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.082-.73.082-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.123-.3-.535-1.52.117-3.16 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.64.24 2.86.118 3.16.768.84 1.233 1.91 1.233 3.22 0 4.61-2.804 5.62-5.476 5.92.43.37.824 1.102.824 2.22 0 1.602-.015 2.894-.015 3.287 0 .322.216.698.83.578C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <h1 className="text-5xl font-bold text-white">GitHub Wrapped</h1>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Enter any GitHub username..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="flex-1 px-6 py-3 rounded-full bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:opacity-90 transition"
            >
              🔍 View Wrapped
            </button>
          </form>
          {viewingUsername && (
            <p className="text-purple-300 text-sm mt-4 text-center">
              📊 Showing stats for: @{viewingUsername}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 mb-8 text-center">
            <p className="text-red-300">❌ {error}</p>
          </div>
        )}

        {/* Stats Display */}
        {stats && !error && (
          <>
            {/* User Info Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-6 flex-wrap">
                <img 
                  src={stats.user?.avatar || `https://avatars.githubusercontent.com/${viewingUsername}?v=4`}
                  alt={viewingUsername}
                  className="w-24 h-24 rounded-full border-4 border-purple-500"
                />
                <div>
                  <h1 className="text-3xl font-bold text-white">{stats.user?.name || viewingUsername}</h1>
                  <p className="text-gray-300">@{viewingUsername}</p>
                  {stats.user?.location && stats.user.location !== 'Not specified' && (
                    <p className="text-gray-400 mt-2">📍 {stats.user.location}</p>
                  )}
                  {stats.user?.joinedDate && (
                    <p className="text-gray-400">📅 Joined: {stats.user.joinedDate}</p>
                  )}
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 text-center">
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">{stats.stats?.totalCommits ?? 0}</p>
                  <p className="text-gray-400 text-sm">Total Commits</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">{stats.stats?.totalRepos ?? 0}</p>
                  <p className="text-gray-400 text-sm">Repositories</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">{stats.stats?.longestStreak ?? 0}</p>
                  <p className="text-gray-400 text-sm">Longest Streak</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-3xl mb-1">{stats.stats?.vibe?.split(' ')[0] || '🦉'}</div>
                  <p className="text-gray-400 text-sm">{stats.stats?.vibe || 'Coding Vibe'}</p>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Top Languages */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">🏆 Top Languages</h3>
                {stats.languages && stats.languages.length > 0 ? (
                  <div className="space-y-3">
                    {stats.languages.map((lang, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-gray-300">{lang.name}</span>
                        <div className="flex-1 mx-4 h-2 bg-white/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{ width: `${(lang.count / stats.languages[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-bold">{lang.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center">No language data available</p>
                )}
              </div>

              {/* Activity Stats */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">⏰ Activity Insights</h3>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-white/5 rounded-xl">
                    <div className="text-4xl mb-2">🕐</div>
                    <p className="text-gray-300">Most Active Hour</p>
                    <p className="text-2xl font-bold text-white">{stats.stats?.mostActiveHour ?? 12}:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commit Heatmap */}
            {stats.commitsByHour && stats.commitsByHour.some(c => c > 0) && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mt-8">
                <h3 className="text-xl font-bold text-white mb-4">📈 Commits by Hour</h3>
                <div className="flex items-end h-32 gap-1">
                  {stats.commitsByHour.map((count, hour) => (
                    <div
                      key={hour}
                      className="flex-1 bg-purple-500/50 hover:bg-purple-500 transition rounded-t"
                      style={{ height: `${Math.min((count / Math.max(...stats.commitsByHour, 1)) * 100, 100)}%` }}
                      title={`${hour}:00 - ${count} commits`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-gray-400 text-xs mt-2">
                  <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
                </div>
              </div>
            )}

            {/* Share Button */}
            <div className="text-center mt-8">
              <button 
                onClick={() => {
                  alert('Share feature coming soon! You can screenshot this page.');
                }}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold hover:opacity-90 transition"
              >
                📸 Share Your Wrapped
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}