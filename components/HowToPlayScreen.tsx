import React from 'react';
import Button from './ui/Button';

interface HowToPlayScreenProps {
  onBack: () => void;
}

const HowToPlayScreen: React.FC<HowToPlayScreenProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-5xl text-yellow-400 mb-8 uppercase">How to Play</h1>
      <div className="w-full max-w-2xl bg-gray-800/50 p-8 border-4 border-gray-700 text-left space-y-4 text-white">
        <p><span className="font-bold text-yellow-400">A/D or Left/Right Arrows:</span> Move left and right.</p>
        <p><span className="font-bold text-yellow-400">W or Up Arrow:</span> Jump.</p>
        <p><span className="font-bold text-yellow-400">Spacebar:</span> Shoot.</p>
        <p><span className="font-bold text-yellow-400">E:</span> Use your character's special ability.</p>
        <p><span className="font-bold text-yellow-400">Shift:</span> Use your character's movement ability (e.g., dash).</p>
        <p><span className="font-bold text-yellow-400">Q:</span> Use your character's grappling hook (if they have one).</p>
        <p><span className="font-bold text-yellow-400">S or Down Arrow:</span> Dig (if your character has that ability).</p>
        <p><span className="font-bold text-yellow-400">Escape:</span> Pause the game.</p>
      </div>
      <Button onClick={onBack} className="mt-8">Back to Menu</Button>
    </div>
  );
};

export default HowToPlayScreen;
