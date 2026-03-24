import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

const FALLBACK_OBJECTIVES = [
  'Find someone wearing the same colour as you and take a selfie together 📸',
  'Be the first one to the dance floor when a new song starts 💃',
  'Compliment a stranger on their festival outfit 🎨',
  'Try a food you\'ve never eaten before at the festival 🍢',
  'Learn the name of someone you\'ve never met before 🤝',
  'Spot all three headliners on the lineup board and remember one song each 🎶',
  'Do a handstand (or attempt one) at the festival 🙃',
  'Find the most creative hat at the festival and photograph it 🎩',
  'Sing along to every word of at least one full song 🎤',
  'Watch the sunset from the top of a hill or high point 🌅',
  'Convince someone to swap a festival accessory with you ✨',
  'Make up a secret handshake with your group 🤙',
];

@Injectable({ providedIn: 'root' })
export class ObjectiveService {
  private firestore = inject(Firestore);

  async getTodayObjective(): Promise<string> {
    const objectivesRef = collection(this.firestore, 'objectives');
    const snap = await getDocs(objectivesRef);

    let objectives: string[] = [];

    if (!snap.empty) {
      objectives = snap.docs.map((d) => d.data()['text'] as string).filter(Boolean);
    }

    if (objectives.length === 0) {
      objectives = FALLBACK_OBJECTIVES;
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const index = dayOfYear % objectives.length;

    return objectives[index];
  }
}
