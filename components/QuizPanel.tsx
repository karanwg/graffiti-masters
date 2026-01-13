'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { playPopSound, playBuzzSound } from '@/lib/audioEngine';
import { TEAM_COLORS } from '@/lib/types';

export function QuizPanel() {
  const { localPlayer, shuffledQuestions, answerQuestion, myPlayerId, gameState } = useGameStore();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const myTeamId = gameState.players.find((p) => p.id === myPlayerId)?.teamId ?? 0;
  const teamColor = TEAM_COLORS[myTeamId]?.neonColor ?? '#00ffff';
  
  const { currentQuestionIndex, hasAnswered, canType } = localPlayer;
  
  // If player has a can, show "use your paint" message
  if (canType !== null && hasAnswered) {
    return (
      <div className="glass-panel p-6 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl mb-3">
            {canType === 'fat' ? '🔥' : '💨'}
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: teamColor }}>
            {canType === 'fat' ? 'FAT CAP UNLOCKED!' : 'Skinny Cap Ready'}
          </h3>
          <p className="text-zinc-400">
            {canType === 'fat' 
              ? 'Paint fast! Big spray, maximum coverage!' 
              : 'Spray to mark your territory...'}
          </p>
        </div>
      </div>
    );
  }
  
  // All questions answered
  if (currentQuestionIndex >= shuffledQuestions.length) {
    return (
      <div className="glass-panel p-6 rounded-2xl">
        <div className="text-center">
          <div className="text-4xl mb-3">🏆</div>
          <h3 className="text-xl font-bold mb-2 text-yellow-400">All Questions Answered!</h3>
          <p className="text-zinc-400">
            You answered {localPlayer.correctAnswers} / {localPlayer.questionsAnswered} correctly
          </p>
        </div>
      </div>
    );
  }
  
  const question = shuffledQuestions[currentQuestionIndex];
  if (!question) return null;
  
  const handleAnswer = (index: number) => {
    if (showFeedback) return;
    
    setSelectedIndex(index);
    setShowFeedback(true);
    
    const isCorrect = index === question.correctIndex;
    
    if (isCorrect) {
      playPopSound();
    } else {
      playBuzzSound();
    }
    
    // Brief delay to show feedback before granting the can
    setTimeout(() => {
      answerQuestion(isCorrect);
      setSelectedIndex(null);
      setShowFeedback(false);
    }, 800);
  };
  
  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl">
      {/* Question counter */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-zinc-500 uppercase tracking-wide">
          Question {currentQuestionIndex + 1} / {shuffledQuestions.length}
        </span>
        <span className="text-sm" style={{ color: teamColor }}>
          {localPlayer.correctAnswers} correct
        </span>
      </div>
      
      {/* Question */}
      <h3 className="text-lg sm:text-xl font-bold mb-4">{question.question}</h3>
      
      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          let buttonStyle = 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700';
          
          if (showFeedback) {
            if (index === question.correctIndex) {
              buttonStyle = 'bg-green-600/30 border-green-500 text-green-400';
            } else if (index === selectedIndex) {
              buttonStyle = 'bg-red-600/30 border-red-500 text-red-400';
            } else {
              buttonStyle = 'bg-zinc-800/50 border-zinc-700 opacity-50';
            }
          }
          
          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showFeedback}
              className={`p-4 rounded-xl border-2 text-left font-medium transition-all ${buttonStyle}`}
            >
              <span className="opacity-50 mr-2">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
