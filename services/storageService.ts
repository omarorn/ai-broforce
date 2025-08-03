import type { GeneratedCharacters, SavedCast, CharacterProfile } from '../types';

const CASTS_STORAGE_KEY = 'ai-broforce-casts';
const INDIVIDUALS_STORAGE_KEY = 'ai-broforce-individuals';
const HIGH_SCORES_STORAGE_KEY = 'ai-broforce-high-scores';

interface HighScore {
  score: number;
  playerName: string;
  date: number;
}

class StorageService {
  // --- High Score Management ---

  public saveHighScore(score: number, playerName: string): void {
    try {
      const highScores = this.loadHighScores();
      highScores.push({ score, playerName, date: Date.now() });
      highScores.sort((a, b) => b.score - a.score);
      highScores.splice(10); // Keep only top 10
      localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(highScores));
    } catch (error) {
      console.error("Error saving high score:", error);
    }
  }

  public loadHighScores(): HighScore[] {
    try {
      const data = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
      return data ? (JSON.parse(data) as HighScore[]) : [];
    } catch (error) {
      console.error("Error loading high scores:", error);
      return [];
    }
  }

  // --- Cast Management ---

  public saveCast(name: string, characters: GeneratedCharacters): void {
    try {
      if (!name.trim()) {
        console.error("Cast name cannot be empty.");
        return;
      }
      const casts = this.loadCasts();
      const existingIndex = casts.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
      const newCast: SavedCast = { name, characters, createdAt: Date.now() };

      if (existingIndex > -1) {
        casts[existingIndex] = newCast;
      } else {
        casts.unshift(newCast);
      }
      localStorage.setItem(CASTS_STORAGE_KEY, JSON.stringify(casts));

      // Also save each character individually
      [...characters.heroes, ...characters.villains].forEach(this.saveIndividualCharacter);

    } catch (error) {
      console.error("Error saving cast to local storage:", error);
    }
  }

  public loadCasts(): SavedCast[] {
    try {
      const data = localStorage.getItem(CASTS_STORAGE_KEY);
      const casts = data ? (JSON.parse(data) as SavedCast[]) : [];
      return casts.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error loading casts from local storage:", error);
      return [];
    }
  }

  public deleteCast(name: string): void {
    try {
      const casts = this.loadCasts().filter(c => c.name !== name);
      localStorage.setItem(CASTS_STORAGE_KEY, JSON.stringify(casts));
    } catch (error) {
      console.error("Error deleting cast from local storage:", error);
    }
  }

  // --- Individual Character Management ---

  public saveIndividualCharacter(character: CharacterProfile): void {
    try {
      const individuals = this.loadIndividualCharacters();
      const existingIndex = individuals.findIndex(c => c.id === character.id);
      if (existingIndex > -1) {
        individuals[existingIndex] = character; // Update existing
      } else {
        individuals.unshift(character); // Add new
      }
      localStorage.setItem(INDIVIDUALS_STORAGE_KEY, JSON.stringify(individuals));
    } catch (error)      {
      console.error("Error saving individual character:", error);
    }
  }

  public loadIndividualCharacters(): CharacterProfile[] {
    try {
      const data = localStorage.getItem(INDIVIDUALS_STORAGE_KEY);
      return data ? (JSON.parse(data) as CharacterProfile[]) : [];
    } catch (error) {
      console.error("Error loading individual characters:", error);
      return [];
    }
  }
  
  public deleteIndividualCharacter(id: number): void {
    try {
      let individuals = this.loadIndividualCharacters();
      individuals = individuals.filter(c => c.id !== id);
      localStorage.setItem(INDIVIDUALS_STORAGE_KEY, JSON.stringify(individuals));
    } catch (error) {
      console.error("Error deleting individual character:", error);
    }
  }
}

export const storageService = new StorageService();