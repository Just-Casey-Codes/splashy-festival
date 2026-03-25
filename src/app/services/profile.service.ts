import { Injectable } from '@angular/core';
import { db } from '../../firebase'; 
import { collection, getDocs } from 'firebase/firestore';
import { Profile } from './profile.model';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  async getAvailableProfiles(): Promise<Profile[]> {
    try {
      const profilesRef = collection(db, 'profiles');
      const snap = await getDocs(profilesRef);
      const allProfiles = snap.docs.map((d: any) => ({
        id: d.id,
        ...(d.data() as Omit<Profile, 'id'>),
      }));
      return allProfiles.filter((p) => !p.claimedBy || p.claimedBy === 'null');
    } catch (err) {
      console.error('[ProfileService] getAvailableProfiles error:', err);
      throw err;
    }
  }

  async getProfileByUid(uid: string): Promise<Profile | null> {
    const usersSnap = await getDocs(collection(db, 'users'));
    const match = usersSnap.docs.find((d: any) => d.id === uid);

    return match
      ? ({ id: match.id, ...(match.data() as Omit<Profile, 'id'>) })
      : null;
  }
}