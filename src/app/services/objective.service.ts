import { Injectable } from '@angular/core';
import { db, storage } from '../../firebase';
import {
  collection, doc, getDoc, addDoc, updateDoc,
  onSnapshot, increment, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Observable } from 'rxjs';

export interface ObjectiveLeaderEntry {
  uid: string;
  profileName: string;
  avatarUrl?: string;
  objectiveCount: number;
}

const FALLBACK_OBJECTIVES = [
  'Find someone wearing the same colour as you and take a selfie together 📸',
  'Be the first one to the dance floor when a new song starts 💃',
  'Compliment a stranger on their festival outfit 🎨',
  'Try a food you\'ve never eaten before at the festival 🍢',
  'Learn the name of someone you\'ve never met before 🤝',
  'Spot all three headliners on the lineup board and remember one song each 🎶',
  'Do a handstand (or attempt one) at the festival 🙃',
  'Find the most creative hat at the festival and photograph it 🎩',
  'Watch the sunset from the top of a hill or high point 🌅',
  'Convince someone to swap a festival accessory with you ✨',
  'Make up a secret handshake with your group 🤙',
  'Get to the front of a crowd during a live performance 🎤',
  'Get a photo with someone you dont know 📸 ',
  'Ask someone to take a picture of you at a stage 📸',
  'Vist all the stages in one day 💃',
  'Find someone that traveled from another country (Not Jere, Mic or Shannon) 🌍',
  'Go to a yoga class 🧘',
  'Go to a silent disco 🎧',
  'Go perform at the open mic 🎤',
];

@Injectable({ providedIn: 'root' })
export class ObjectiveService {

  private seededIndex(uid: string, dayOfYear: number, refreshCount: number, total: number): number {
    const uidSum = uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const seed = uidSum * 31 + dayOfYear + refreshCount * 7919;
    const x = Math.sin(seed) * 10000;
    return Math.abs(Math.floor(x % total));
  }

  private getDayOfYear(): number {
    const now = new Date();
    return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  }

  todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  async getTodayObjective(uid: string, refreshCount = 0): Promise<string> {
    try {
      const snap = await getDoc(doc(db, 'objectives', 'list'));
      const objectives: string[] = snap.exists()
        ? (snap.data()['items'] as string[]) ?? FALLBACK_OBJECTIVES
        : FALLBACK_OBJECTIVES;
      return objectives[this.seededIndex(uid, this.getDayOfYear(), refreshCount, objectives.length)];
    } catch {
      return FALLBACK_OBJECTIVES[this.seededIndex(uid, this.getDayOfYear(), refreshCount, FALLBACK_OBJECTIVES.length)];
    }
  }

  async getNewObjective(uid: string, currentRefreshCount: number): Promise<{ objective: string; refreshCount: number }> {
    const newCount = currentRefreshCount + 1;
    await updateDoc(doc(db, 'users', uid), { objectiveRefreshCount: newCount });
    const objective = await this.getTodayObjective(uid, newCount);
    return { objective, refreshCount: newCount };
  }

  async completeObjective(
    uid: string, profileName: string, avatarUrl: string,
    objectiveText: string, file: File
  ): Promise<void> {
    const compressed = await this.compressImage(file);
    const storageRef = ref(storage, `photos/${uid}/${Date.now()}_objective.jpg`);
    const snapshot = await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
    const imageUrl = await getDownloadURL(snapshot.ref);

    await addDoc(collection(db, 'photos'), {
      uid, profileName, avatarUrl, imageUrl,
      caption: `🎯 Objective: ${objectiveText}`,
      uploadedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', uid), {
      objectiveCount: increment(1),
      lastObjectiveDate: this.todayKey(),
    });
  }

  getLeaderboard(): Observable<ObjectiveLeaderEntry[]> {
    return new Observable((subscriber) => {
      const unsubscribe = onSnapshot(collection(db, 'users'), (snap) => {
        const entries = snap.docs
          .map((d) => ({
            uid: d.id,
            profileName: d.data()['profileName'] ?? '',
            avatarUrl: d.data()['avatarUrl'],
            objectiveCount: d.data()['objectiveCount'] ?? 0,
          }))
          .filter((e) => e.objectiveCount > 0)
          .sort((a, b) => b.objectiveCount - a.objectiveCount);
        subscriber.next(entries);
      }, (err) => subscriber.error(err));
      return { unsubscribe };
    });
  }

  private compressImage(file: File, maxPx = 1024, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Compression failed')), 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = url;
    });
  }
}
