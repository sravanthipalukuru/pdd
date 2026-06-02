import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Award, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import GameCard from '../components/GameCard';
import { useStore } from '../store/useStore';
import { allGames, routeMap } from '../data/games';
import './ChildPortal.css';

export default function ChildPortal() {
  const navigate = useNavigate();
  const { level, coins, badges, xp, avatar, displayName, userId, gameLevels } = useStore();
  const nextLevelXp = level * 100;
  const progressPercent = (xp % 100) / 100 * 100;

  // Find 3 recommended games the user hasn't mastered yet (level < 10)
  // Filter by age if the user has an age set
  const userAge = parseInt(useStore(state => state.age), 10);
  const incompleteGames = allGames.filter(g => (gameLevels[g.id] || 0) < 10);
  
  let recommendedGames = incompleteGames;
  if (!isNaN(userAge)) {
    recommendedGames = incompleteGames.filter(g => userAge >= g.minAge && userAge <= g.maxAge);
    // If they master everything in their age group, fallback to all unmastered
    if (recommendedGames.length === 0) recommendedGames = incompleteGames;
  }
  
  const displayGames = recommendedGames.length >= 3 ? recommendedGames.slice(0, 3) : allGames.slice(0, 3);

  const handlePlay = (game) => {
    if (routeMap[game.id]) {
      navigate(routeMap[game.id]);
    } else {
      alert('🚧 Coming soon! This game is still being built.');
    }
  };

  return (
    <div className="child-portal section-pad">
      <div className="container">
        
        {/* Header / Avatar Status */}
        <header className="portal-header">
          <motion.div 
            className="avatar-status glass"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="avatar-circle">{avatar || '🐻'}</div>
            <div className="status-info">
              <h2>Welcome back, {displayName || userId || 'Friend'}!</h2>
              <div className="status-badges">
                <span className="badge badge-yellow"><Star size={14}/> Level {level}</span>
                <span className="badge badge-teal">🪙 {coins} Coins</span>
                <span className="badge badge-pink"><Award size={14}/> {badges.length} Badges</span>
              </div>
            </div>
          </motion.div>

          <Link to="/dr-smiles" className="btn btn-yellow dr-smiles-btn pulse-glow">
            Chat with Dr. Smiles 🐻
          </Link>
        </header>

        {/* Daily Mission */}
        <motion.section 
          className="daily-mission card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mission-content">
            <span className="badge badge-pink">Daily Mission ✨</span>
            <h3>Defeat the Sugar Monsters!</h3>
            <p>Play "Tooth Defender" today to earn 50 bonus coins and a special shield for your avatar.</p>
            <button className="btn btn-primary" onClick={() => navigate('/game/tooth-defender')}>Start Mission</button>
          </div>
          <div className="mission-graphic bounce-in">
            👾 🛡️ 🦷
          </div>
        </motion.section>

        {/* Continue Playing */}
        <section className="portal-section">
          <div className="section-title-row">
            <h2 className="section-title">Recommended for You</h2>
            <Link to="/games" className="see-all-link">All Games <ChevronRight size={16}/></Link>
          </div>
          <div className="games-grid">
            {displayGames.map((game, i) => {
              const currentLevel = gameLevels[game.id] || 0;
              return (
                <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}>
                  <GameCard game={game} currentLevel={currentLevel} onPlay={handlePlay} />
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* My Smile Section */}
        <section className="portal-section">
          <h2 className="section-title">My Smile Progress</h2>
          <div className="smile-progress card">
             <div className="progress-bar-container">
                <div className="progress-bar" style={{width: `${progressPercent}%`}}></div>
             </div>
             <p className="text-center mt-3">{Math.round(progressPercent)}% to <strong>Level {level + 1}</strong>! Keep playing!</p>
          </div>
        </section>

      </div>
    </div>
  );
}
