import { motion } from 'framer-motion';
import { Play, Star, Lock, CheckCircle2 } from 'lucide-react';
import './GameCard.css';

export default function GameCard({ game, locked = false, currentLevel = 0, onPlay }) {
  const isMastered = currentLevel >= 10;
  const progressPercent = (currentLevel / 10) * 100;

  return (
    <motion.div 
      className={`game-card card ${locked ? 'game-card--locked' : ''} ${isMastered ? 'game-card--completed' : ''}`}
      whileHover={!locked ? { y: -8, scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="game-card__image" style={{ background: game.color }}>
        <span className="game-card__emoji">{game.emoji}</span>
        {locked && (
          <div className="game-card__lock-overlay">
            <Lock size={32} color="white" />
          </div>
        )}
        {isMastered && !locked && (
          <div className="game-card__completed-badge">
            <CheckCircle2 size={24} color="white" fill="var(--teal)" />
          </div>
        )}
      </div>
      
      <div className="game-card__content">
        <div className="game-card__header">
          <h3 className="game-card__title">{game.title}</h3>
          {!locked && (
            <div className="game-card__level-badge" style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--teal)', background: 'var(--teal-light)', padding: '4px 8px', borderRadius: 12 }}>
              {isMastered ? 'MASTERED' : `Level ${currentLevel}/10`}
            </div>
          )}
        </div>
        
        <p className="game-card__desc">{game.desc}</p>
        
        {!locked && !isMastered && (
          <div style={{ marginTop: 12, marginBottom: 4, height: 6, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--teal)', transition: 'width 0.3s' }}></div>
          </div>
        )}
        
        <div className="game-card__footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-teal">{game.category}</span>
            {game.minAge && game.maxAge && (
              <span className="badge badge-purple" style={{ fontSize: '10px' }}>{game.minAge}-{game.maxAge} Yrs</span>
            )}
          </div>
          <button 
            className="btn btn-primary btn-sm game-card__btn" 
            disabled={locked}
            onClick={() => onPlay && onPlay(game)}
          >
            {locked ? 'Locked' : <><Play size={14} fill="currentColor" /> Play</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
