import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GeneratedCharacters, CharacterProfile, SavedCast } from '../types';
import { generateCharacters, generateCharacterImage, generateMissionBriefing } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import Button from './ui/Button';
import Input from './ui/Input';
import Loader from './ui/Loader';
import CharacterProfileScreen from './CharacterProfileScreen';
import { IoVolumeHighOutline, IoVolumeMuteOutline, IoExpandOutline, IoContractOutline } from 'react-icons/io5';

interface MenuScreenProps {
  onStartGame: (characters: GeneratedCharacters, startingHero: CharacterProfile) => void;
}

type View = 'generate' | 'casting' | 'review' | 'portraits' | 'briefing' | 'casting_couch' | 'edit_character';

const themeSuggestions = [
  'famous action movie',
  'cheesy 90s cartoon',
  'epic fantasy novel',
  'cyberpunk video game',
  'classic comic book',
  'spaghetti western',
  'kaiju monster movie',
  'saturday morning cartoon',
];

const getRandomTheme = () => {
    const randomPart = themeSuggestions[Math.floor(Math.random() * themeSuggestions.length)];
    return `Silly doppelgangers of ${randomPart} heroes and villains`;
};

// --- START: Placeholder data for slot machine animation ---
const placeholderNames = ['Action Hero', 'Tough Guy', 'Commando', 'Super Soldier', 'Villain', 'Bad Dude', 'Dr. Evil', 'Rogue Agent', 'Mercenary'];
const placeholderWeapons = ['Big Gun', 'Sharp Thing', 'Boom Stick', 'Laser Blaster', 'Plasma Rifle', 'Chain Gun', 'Rocket Pod'];
const placeholderDescriptions = [
    "A lone wolf with a mysterious past.",
    "They're the best there is at what they do.",
    "Justice is coming, and it's heavily armed.",
    "Ready to save the world, one explosion at a time.",
    "An unstoppable force of pure chaos.",
];
const placeholderSpecials = ['Mega Bomb', 'Rage Mode', 'Stealth Cloak', 'Sentry Gun', 'Orbital Strike'];
const placeholderMoves = ['Grapple Hook', 'Teleport', 'Super Jump', 'Jetpack Burst', 'Phase Shift'];
const placeholderCatchphrases = [
    "Let's get dangerous.",
    "I have a bad feeling about this.",
    "It's showtime!",
    "They messed with the wrong bro.",
    "This is gonna be a blast.",
];
// --- END: Placeholder data ---

const CharacterCard: React.FC<{
  character: CharacterProfile;
  onClick?: () => void;
  isCycling?: boolean;
}> = ({ character, onClick, isCycling = false }) => {
  const [displayChar, setDisplayChar] = useState(character);

  useEffect(() => {
      if (!isCycling) {
          setDisplayChar(character);
          return;
      }
      
      const interval = setInterval(() => {
          setDisplayChar(prev => ({
              ...prev,
              name: placeholderNames[Math.floor(Math.random() * placeholderNames.length)],
              description: placeholderDescriptions[Math.floor(Math.random() * placeholderDescriptions.length)],
              weaponType: placeholderWeapons[Math.floor(Math.random() * placeholderWeapons.length)],
              specialAbility: placeholderSpecials[Math.floor(Math.random() * placeholderSpecials.length)],
              movementAbility: placeholderMoves[Math.floor(Math.random() * placeholderMoves.length)],
              catchphrase: placeholderCatchphrases[Math.floor(Math.random() * placeholderCatchphrases.length)],
          }));
      }, 100);

      return () => clearInterval(interval);
  }, [isCycling, character]);


  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioService.speak(displayChar.catchphrase);
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gray-800 border-2 border-gray-700 p-4 transition-all duration-200 flex flex-col ${onClick ? 'cursor-pointer hover:border-yellow-400 hover:scale-105' : ''}`}
    >
      {displayChar.imageUrl ? (
        <img src={displayChar.imageUrl} alt={displayChar.name} className="w-full h-40 object-contain mb-2 bg-gray-600" />
      ) : (
        <div className="w-full h-40 bg-gray-700 flex items-center justify-center mb-2">
          <div className="text-gray-500 text-6xl">?</div>
        </div>
      )}
      <div className="flex-grow">
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-sm sm:text-lg font-bold uppercase">{displayChar.name}</h3>
          <span className="text-xs bg-yellow-400 text-gray-900 font-bold px-2 py-1 rounded whitespace-nowrap truncate">
            {displayChar.weaponType}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 h-10 overflow-hidden">{displayChar.description}</p>
        
        <div className="flex items-center justify-between mt-2 gap-2">
          <p className="text-xs text-cyan-400 italic flex-grow truncate">"{displayChar.catchphrase}"</p>
          <button
              onClick={handleSpeak}
              className="p-1 rounded-full hover:bg-yellow-500/50 transition-colors"
              aria-label={`Say catchphrase: ${displayChar.catchphrase}`}
          >
              <IoVolumeHighOutline className="text-white h-4 w-4"/>
          </button>
        </div>

        <p className="text-xs text-purple-400 mt-1 truncate">Move: {displayChar.movementAbility}</p>
        <p className="text-xs text-yellow-500 mt-1 truncate">Special: {displayChar.specialAbility}</p>
      </div>
    </div>
  )
};

const MenuScreen: React.FC<MenuScreenProps> = ({ onStartGame }) => {
  const [view, setView] = useState<View>('generate');
  const [characters, setCharacters] = useState<GeneratedCharacters | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<CharacterProfile | null>(null);

  const [theme, setTheme] = useState<string>(getRandomTheme());
  const [characterCount, setCharacterCount] = useState<number>(9);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [savedCasts, setSavedCasts] = useState<SavedCast[]>([]);
  const [individualCharacters, setIndividualCharacters] = useState<CharacterProfile[]>([]);
  const [isGeneratingPortraits, setIsGeneratingPortraits] = useState(false);
  
  const [currentCastName, setCurrentCastName] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const saveInputRef = useRef<HTMLInputElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const handleMuteToggle = () => {
      const newMuteState = audioService.toggleMute();
      setIsMuted(newMuteState);
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  useEffect(() => {
    setSavedCasts(storageService.loadCasts());
    setIndividualCharacters(storageService.loadIndividualCharacters());
    return () => audioService.stopMusic();
  }, []);

  const handleGenerateCharacters = async () => {
    if (!theme.trim() || characterCount <= 0) {
      setError('Please enter a theme and a valid character count.');
      return;
    }
    setError(null);
    setView('casting');
    setLoadingMessage('Casting your action stars...');

    try {
      const newChars = await generateCharacters(theme, characterCount);
      if (newChars.heroes.length === 0) {
        throw new Error("The AI didn't generate any heroes. Try a different theme!");
      }
      setCharacters(newChars);
      setCurrentCastName(null);
      setView('review');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setView('generate');
    }
  };
  
  const handleGenerateAllPortraits = async () => {
      if (!characters) return;
      
      setIsGeneratingPortraits(true);
      
      const charsToUpdate = [...characters.heroes, ...characters.villains].filter(c => !c.imageUrl);

      for (const char of charsToUpdate) {
          try {
              const imageUrl = await generateCharacterImage(char);
              setCharacters(currentChars => {
                  if (!currentChars) return null;
                  const newChars = JSON.parse(JSON.stringify(currentChars));
                  const charToUpdate = newChars.heroes.find(c => c.id === char.id) || newChars.villains.find(c => c.id === char.id);
                  if (charToUpdate) {
                      charToUpdate.imageUrl = imageUrl;
                  }
                  return newChars;
              });
          } catch (err) {
              console.error(`Failed to generate image for ${char.name}:`, err);
              // Optionally set a placeholder error image
          }
      }
      
      setIsGeneratingPortraits(false);
  };
  
  const handleGenerateBriefing = async () => {
      if (!characters) return;
      setView('briefing');
      setLoadingMessage('Generating mission briefing...');
      const briefing = await generateMissionBriefing(characters);
      setCharacters(chars => chars ? ({...chars, missionBriefing: briefing}) : null);
  };

  const handleLaunchGame = () => {
      if (!characters || characters.heroes.length === 0) {
          setError("Cannot start game without heroes!");
          setView('generate');
          return;
      }
      const startingHero = characters.heroes[Math.floor(Math.random() * characters.heroes.length)];
      onStartGame(characters, startingHero);
  };

  const handleEditCharacter = (char: CharacterProfile) => {
      setEditingCharacter(char);
      setView('edit_character');
  };
  
  const handleSaveCharacter = (updatedChar: CharacterProfile) => {
    if (!characters) return;
    const newCharacters: GeneratedCharacters = JSON.parse(JSON.stringify(characters));
    const heroIndex = newCharacters.heroes.findIndex(c => c.id === updatedChar.id);
    if(heroIndex > -1) {
        newCharacters.heroes[heroIndex] = updatedChar;
    } else {
        const villainIndex = newCharacters.villains.findIndex(c => c.id === updatedChar.id);
        if(villainIndex > -1) {
            newCharacters.villains[villainIndex] = updatedChar;
        }
    }
    setCharacters(newCharacters);
    
    // Auto-save if it's an existing, named cast
    if (currentCastName) {
        storageService.saveCast(currentCastName, newCharacters);
    } else {
        // If not part of a named cast, still save the individual character update
        storageService.saveIndividualCharacter(updatedChar);
    }
    
    setIndividualCharacters(storageService.loadIndividualCharacters());
    setView('review');
    setEditingCharacter(null);
  };

  const handleSaveNewCast = (name: string) => {
      if(characters && name.trim()) {
          storageService.saveCast(name.trim(), characters);
          setCurrentCastName(name.trim());
          setSavedCasts(storageService.loadCasts());
          setIndividualCharacters(storageService.loadIndividualCharacters());
          setIsSaveModalOpen(false);
      }
  };

  const handleLoadCast = (cast: SavedCast) => {
      setCharacters(cast.characters);
      setCurrentCastName(cast.name);
      setView('review');
  };
  
  const handleDeleteCast = (name: string) => {
      if(window.confirm(`Are you sure you want to delete the cast "${name}"?`)){
        storageService.deleteCast(name);
        setSavedCasts(storageService.loadCasts());
      }
  };

  const handleDeleteIndividual = (id: number) => {
      if(window.confirm(`Are you sure you want to permanently delete this character?`)){
        storageService.deleteIndividualCharacter(id);
        setIndividualCharacters(storageService.loadIndividualCharacters());
      }
  };

  const renderContent = () => {
    switch (view) {
        case 'casting':
            const placeholderChar: CharacterProfile = {id:0, name:'', description:'', weaponType:'', specialAbility:'', movementAbility:'', catchphrase:''};
            return (
                <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 z-10">
                    <h2 className="text-3xl text-yellow-400 mb-6 uppercase animate-pulse">{loadingMessage}</h2>
                    <div className="w-full max-w-6xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Array.from({length: 5}).map((_, i) => <CharacterCard key={i} character={placeholderChar} isCycling={true} />)}
                    </div>
                </div>
            )
        
        case 'review':
             if (!characters) return null;
             const portraitsToGenerate = [...characters.heroes, ...characters.villains].filter(c => !c.imageUrl).length;
             return (
                 <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 z-10">
                     <div className="w-full max-w-7xl mx-auto text-center">
                         <h1 className="text-3xl md:text-4xl text-yellow-400 my-4 uppercase">{currentCastName || 'Your New Cast'}</h1>
                         <div className="flex justify-center gap-4 mb-6">
                            <Button onClick={handleGenerateAllPortraits} className="!bg-blue-600 hover:!bg-blue-700 text-lg" disabled={isGeneratingPortraits || portraitsToGenerate === 0}>
                                {isGeneratingPortraits ? 'Generating...' : `Generate All Portraits (${portraitsToGenerate})`}
                            </Button>
                            <Button onClick={() => setIsSaveModalOpen(true)} className="!bg-purple-600 hover:!bg-purple-700 text-lg" disabled={isGeneratingPortraits}>
                                {currentCastName ? 'Save As...' : 'Save Cast'}
                            </Button>
                            <Button onClick={handleGenerateBriefing} className="!bg-green-600 hover:!bg-green-700 text-lg" disabled={isGeneratingPortraits}>
                                Proceed to Mission Briefing
                            </Button>
                         </div>
                         <h2 className="text-xl text-white mb-2">Heroes</h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                             {characters.heroes.map(c => <CharacterCard key={c.id} character={c} onClick={() => handleEditCharacter(c)} />)}
                         </div>
                         <h2 className="text-xl text-white mb-2">Villains</h2>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                            {characters.villains.map(c => <CharacterCard key={c.id} character={c} onClick={() => handleEditCharacter(c)} />)}
                         </div>
                     </div>
                 </div>
             )
            
        case 'briefing':
            if (!characters) return null;
            return (
                <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 z-10">
                    <div className="w-full max-w-2xl mx-auto text-center bg-gray-800/50 p-8 border-4 border-gray-700">
                        <h1 className="text-3xl md:text-4xl text-yellow-400 mb-6 uppercase">Mission Briefing</h1>
                        <p className="text-lg text-white leading-relaxed mb-8">
                           {characters.missionBriefing || <Loader />}
                        </p>
                        <Button onClick={handleLaunchGame} disabled={!characters.missionBriefing} className="!bg-red-600 hover:!bg-red-700 text-2xl">
                            LAUNCH MISSION
                        </Button>
                    </div>
                </div>
            );
            
        case 'edit_character':
            if (!editingCharacter) return null;
            return (
                <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 z-10">
                    <CharacterProfileScreen 
                        character={editingCharacter} 
                        onSave={handleSaveCharacter} 
                        onBack={() => setView('review')} 
                    />
                </div>
            );
            
        case 'casting_couch':
            return (
                <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 z-10">
                    <h1 className="text-3xl md:text-4xl text-yellow-400 my-6 uppercase">Casting Couch</h1>
                    
                    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
                        {/* Saved Casts Section */}
                        <div>
                            <h2 className="text-2xl text-white mb-4 text-center">Saved Casts</h2>
                            <div className="space-y-4">
                                {savedCasts.length > 0 ? (
                                    savedCasts.map(cast => (
                                        <div key={cast.createdAt} className="bg-gray-800 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-2 border-gray-700">
                                            <div className="flex-grow">
                                                <h3 className="text-xl text-white">{cast.name}</h3>
                                                <p className="text-sm text-gray-400">
                                                    {cast.characters.heroes.length} Heroes, {cast.characters.villains.length} Villains - 
                                                    Saved on {new Date(cast.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button onClick={() => handleLoadCast(cast)} className="!py-2">Load</Button>
                                                <Button onClick={() => handleDeleteCast(cast.name)} className="!bg-red-800 hover:!bg-red-900 !py-2">Delete</Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-400 text-lg py-8">No saved casts yet.</p>
                                )}
                            </div>
                        </div>

                        {/* All Individual Characters Section */}
                        <div>
                            <h2 className="text-2xl text-white mb-4 text-center">All Created Characters</h2>
                            {individualCharacters.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {individualCharacters.map(char => (
                                        <div key={char.id} className="bg-gray-800 p-3 border-2 border-gray-700">
                                            <h3 className="text-lg text-yellow-400 truncate">{char.name}</h3>
                                            <p className="text-sm text-gray-400 truncate">{char.description}</p>
                                            <div className="mt-3 flex gap-2">
                                                <Button onClick={() => handleEditCharacter(char)} className="!py-1 !text-sm">Edit</Button>
                                                <Button onClick={() => handleDeleteIndividual(char.id)} className="!bg-red-800 hover:!bg-red-900 !py-1 !text-sm">Delete</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 text-lg py-8">No individual characters saved yet.</p>
                            )}
                        </div>
                    </div>

                    <Button onClick={() => setView('generate')} className="mt-8">Back to Menu</Button>
                </div>
            );

        case 'generate':
        default:
          return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative z-10">
              <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={handleMuteToggle} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white">
                      {isMuted ? <IoVolumeMuteOutline size={24} /> : <IoVolumeHighOutline size={24} />}
                  </button>
                  <button onClick={handleToggleFullscreen} className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white">
                      {isFullscreen ? <IoContractOutline size={24} /> : <IoExpandOutline size={24} />}
                  </button>
              </div>

              <div className="w-full max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-6xl text-yellow-400 drop-shadow-[0_4px_0_#9A3412] mb-2">AI BROFORCE</h1>
                <h2 className="text-xl md:text-2xl bg-gray-700 text-white inline-block px-4 py-1 mb-8">RECHARGED</h2>
                
                <div className="bg-gray-800/50 p-6 md:p-8 border-4 border-gray-700">
                  <p className="mb-4 text-lg">Enter a theme, or use a random one!</p>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <Input 
                      type="text"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="e.g., Cyberpunk Ninjas, Space Vikings"
                    />
                     <Button onClick={() => setTheme(getRandomTheme())} className="!bg-blue-600 hover:!bg-blue-700">Random</Button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-center">
                    <label htmlFor="char-count" className="text-lg">Number of Heroes/Villains:</label>
                    <Input 
                      id="char-count"
                      type="number"
                      value={characterCount}
                      onChange={(e) => setCharacterCount(parseInt(e.target.value, 10) || 1)}
                      className="!w-24 text-center"
                      min="1"
                      max="10"
                    />
                  </div>
                  <Button onClick={handleGenerateCharacters} disabled={!theme.trim() || !characterCount} className="!bg-green-600 hover:!bg-green-700 text-xl px-8 py-4">
                    Generate Cast
                  </Button>
                  {(savedCasts.length > 0 || individualCharacters.length > 0) && (
                     <div className="mt-6">
                        <Button onClick={() => setView('casting_couch')} className="!bg-purple-600 hover:!bg-purple-700">
                            View Casting Couch ({savedCasts.length} Casts, {individualCharacters.length} Bros)
                        </Button>
                     </div>
                  )}
                  {error && <p className="text-red-500 mt-4">{error}</p>}
                </div>
              </div>
            </div>
          );
    }
  }

  return (
    <>
      {renderContent()}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 border-4 border-gray-700 max-w-sm w-full">
                <h2 className="text-2xl text-yellow-400 mb-4">Save Your Cast</h2>
                <Input
                    type="text"
                    placeholder="Enter cast name..."
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveNewCast( (e.target as HTMLInputElement).value ) }}
                    ref={saveInputRef}
                />
                <div className="flex justify-end gap-4 mt-6">
                    <Button onClick={() => setIsSaveModalOpen(false)} className="!bg-gray-600 hover:!bg-gray-700 !py-2">Cancel</Button>
                    <Button onClick={() => handleSaveNewCast(saveInputRef.current?.value || '')} className="!py-2">Save</Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default MenuScreen;