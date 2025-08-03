import { GoogleGenAI, Type } from "@google/genai";
import type { GeneratedCharacters, CharacterProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const characterSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "The character's cool action-hero or villain name."
    },
    description: {
      type: Type.STRING,
      description: "A short, punchy, one-sentence description of the character's theme."
    },
    weaponType: {
        type: Type.STRING,
        description: "The character's primary weapon. Be creative and specific (e.g., 'Plasma Rifle', 'Dual-Wielding Pistols', 'BFG 9000', 'Laser Katana')."
    },
    specialAbility: {
        type: Type.STRING,
        description: "A brief (2-4 word) description of a unique special ability, e.g., 'Temporary Invincibility', 'Deployable Turret', 'Cluster Grenade'."
    },
    movementAbility: {
        type: Type.STRING,
        description: "A unique movement ability. Examples: 'Double Jump', 'Air Dash', 'Wall Slide'."
    },
    catchphrase: {
        type: Type.STRING,
        description: "A cheesy, memorable one-liner or catchphrase for the character. e.g., 'Hasta la vista, baddie.'"
    }
  }
};


export async function generateCharacters(theme: string, count: number = 5): Promise<GeneratedCharacters> {
  const generationSchema = {
    type: Type.OBJECT,
    properties: {
      heroes: {
        type: Type.ARRAY,
        description: `A list of ${count} unique and compelling action heroes.`,
        items: characterSchema
      },
      villains: {
        type: Type.ARRAY,
        description: `A list of ${count} unique and menacing villains for the heroes to fight.`,
        items: characterSchema
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of ${count} action movie heroes and ${count} villains based on the theme: "${theme}".
These should be funny, over-the-top parodies of famous action movie characters.
For example, if the theme is '80s action heroes', a character like Rambo could become 'Bro-bo' and Terminator could be 'The Brominator'.
Be creative with the names and descriptions to capture the cheesy, explosive spirit of these films.
Assign a creative weaponType, a unique specialAbility, a unique movementAbility, and a cool catchphrase to each character.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: generationSchema,
        temperature: 0.9,
      }
    });

    const jsonText = response.text.trim();
    let data = JSON.parse(jsonText);
    
    // Basic validation
    if (!data.heroes || !data.villains) {
        throw new Error("AI response did not contain valid hero/villain data.");
    }
    
    // Add unique IDs
    let idCounter = Date.now();
    data.heroes = data.heroes.map((h: any) => ({...h, id: idCounter++}));
    data.villains = data.villains.map((v: any) => ({...v, id: idCounter++}));

    return data as GeneratedCharacters;
  } catch (error) {
    console.error("Error generating characters with Gemini:", error);
    // Provide a fallback for a better user experience on API error
    return {
      heroes: [
        { id: 1, name: "Bro-bo", description: "A one-man army with an explosive temper and a bigger bandana.", weaponType: "Explosive-Tip Bow", specialAbility: "Screaming Rage", movementAbility: "Wall Slide", catchphrase: "They drew first blood, not me!" },
        { id: 2, name: "The Brominator", description: "Cybernetic organism. Living tissue over metal endoskeleton. He'll be back.", weaponType: "Lever-Action Shotgun", specialAbility: "Temporary Invincibility", movementAbility: "Double Jump", catchphrase: "I need your boots, your clothes, and your motorcycle." },
        { id: 3, name: "Bro Hard", description: "Wrong guy, wrong place, wrong time. Yippee-ki-yay.", weaponType: "Standard Issue Pistol", specialAbility: "Dash Strike", movementAbility: "Air Dash", catchphrase: "Welcome to the party, pal!" },
        { id: 4, name: "Indiana Brones", description: "It belongs in a museum! And so do these bad guys.", weaponType: "Trusty Whip", specialAbility: "Whip Crack", movementAbility: "Double Jump", catchphrase: "Snakes. Why'd it have to be snakes?" },
      ],
      villains: [
        { id: 101, name: "Colonel Ludmilla", description: "A ruthless commander with an eyepatch and a deep-seated grudge.", weaponType: "AK-47", specialAbility: "Airstrike", movementAbility: "Air Dash", catchphrase: "For the motherland... of evil!" },
        { id: 102, name: "CEO Evilman", description: "He's not just evil, he's corporately evil. His hostile takeovers are literal.", weaponType: "Golden Gun", specialAbility: "Summon Minions", movementAbility: "Double Jump", catchphrase: "Consider this your final notice." },
        { id: 103, name: "Dr. No-Good", description: "A maniacal scientist with a doomsday device and terrible fashion sense.", weaponType: "Acid Sprayer", specialAbility: "Gas Cloud", movementAbility: "Wall Slide", catchphrase: "The world will tremble before my genius!" },
        { id: 104, name: "Cyber Commando", description: "Half man, half machine, all bad attitude.", weaponType: "Laser Minigun", specialAbility: "EMP Blast", movementAbility: "Air Dash", catchphrase: "You are obsolete." },
      ],
    };
  }
}

export async function generateCharacterImage(character: CharacterProfile): Promise<string> {
    const prompt = `Full body portrait of an action hero. Description: "${character.description}". Wielding a ${character.weaponType}. 8-bit pixel art style, vibrant colors, action pose, side-scroller game character, transparent PNG background.`;
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png', // Use PNG for transparency
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the API.");
        }
    } catch (error) {
        console.error("Error generating character image:", error);
        throw error; // Re-throw to be caught by the UI component
    }
}


export async function generateMissionBriefing(characters: GeneratedCharacters): Promise<string> {
  const heroNames = characters.heroes.map(h => h.name).join(', ');
  const villainNames = characters.villains.map(v => v.name).join(', ');

  const prompt = `Generate a short, over-the-top, action-movie-style mission briefing.
The team of heroes are: ${heroNames}.
The villains they must face are: ${villainNames}.
The briefing should set up a simple, classic action movie plot. For example, a villain has stolen a super-weapon, a hero has been captured, or the villains are about to unleash a doomsday device.
Keep it under 50 words. Make it punchy and exciting.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating mission briefing:", error);
    return `Listen up, team! The villains, led by ${villainNames}, have captured one of our own. Your mission is to get in there, rescue the hostage, and neutralize the threat. Good luck.`;
  }
}
