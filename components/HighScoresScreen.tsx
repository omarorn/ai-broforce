import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import Button from './ui/Button';

interface HighScore {
  score: number;
  playerName: string;
  date: number;
}

interface HighScoresScreenProps {
  onBack: () => void;
}

const HighScoresScreen: React.FC<HighScoresScreenProps> = ({ onBack }) => {
  const [highScores, setHighScores] = useState<HighScore[]>([]);

  useEffect(() => {
    setHighScores(storageService.loadHighScores());
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-5xl text-yellow-400 mb-8 uppercase">High Scores</h1>
      <div className="w-full max-w-lg bg-gray-800/50 p-8 border-4 border-gray-700">
        {highScores.length > 0 ? (
          <ol className="space-y-4">
            {highScores.map((score, index) => (
              <li key={index} className="text-2xl text-white flex justify-between">
                <span>{index + 1}. {score.playerName}</span>
                <span>{score.score}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-2xl text-white">No high scores yet!</p>
        )}
      </div>
      <Button onClick={onBack} className="mt-8">Back to Menu</Button>
    </div>
  );
};

export default HighScoresScreen;
