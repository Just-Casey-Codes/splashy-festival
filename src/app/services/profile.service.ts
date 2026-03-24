import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { Profile } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private firestore = inject(Firestore);

  async getAvailableProfiles(): Promise<Profile[]> {
    const profilesRef = collection(this.firestore, 'profiles');
    const snap = await getDocs(profilesRef);
    const allProfiles = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Profile, 'id'>),
    }));
    return allProfiles.filter((p) => !p.claimedBy);
  }

  async getProfileByUid(uid: string): Promise<Profile | null> {
    const usersSnap = await getDocs(collection(this.firestore, 'users'));
    const match = usersSnap.docs.find((d) => d.id === uid);
    return match ? ({ id: match.id, ...(match.data() as Omit<Profile, 'id'>) }) : null;
  }
}