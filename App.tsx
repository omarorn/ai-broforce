import React, { useState, useCallback } from 'react';
import MenuScreen from './components/MenuScreen';
import GameScreen from './components/GameScreen';
import { GameState } from './types';
import type { GeneratedCharacters, CharacterProfile } from './types';
import Button from './components/ui/Button';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [characterData, setCharacterData] = useState<{characters: GeneratedCharacters, hero: CharacterProfile} | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);

  const handleStartGame = useCallback((generatedCharacters: GeneratedCharacters, hero: CharacterProfile) => {
    setCharacterData({ characters: generatedCharacters, hero });
    setGameState(GameState.PLAYING);
    audioService.playMusic('music_game');
  }, []);

  const handleGameOver = useCallback((score: number) => {
    audioService.stopMusic();
    setFinalScore(score);
    setGameState(GameState.GAME_OVER);
  }, []);
  
  const handleRestart = useCallback(() => {
      setFinalScore(0);
      setCharacterData(null);
      setGameState(GameState.MENU);
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case GameState.PLAYING:
        if (!characterData) return null;
        return <GameScreen characters={characterData.characters} startingHero={characterData.hero} onGameOver={handleGameOver} onExit={handleRestart} />;
      case GameState.GAME_OVER:
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-6xl text-red-600 uppercase mb-4">Game Over</h1>
                <p className="text-3xl text-yellow-400 mb-8">Final Score: {finalScore}</p>
                <Button onClick={handleRestart}>Return to Menu</Button>
            </div>
        );
      case GameState.MENU:
      default:
        return <MenuScreen onStartGame={handleStartGame} />;
    }
  };

  return (
    <React.Fragment>
      {renderContent()}
    </React.Fragment>
  );
};

export default App;
