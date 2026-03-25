import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../firebase';

export interface UserProfile {
  uid: string;
  profileName: string;
  avatarUrl?: string;
  hangingWith?: string[];
}

@Component({
  selector: 'app-hanging-with',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hanging-with.component.html',
  styleUrls: ['./hanging-with.component.css'],
})
export class HangingWithComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private unsubscribeSnapshot?: () => void;

  isLoading = true;
  isSaving = false;
  myUid = '';
  myHangingWith: string[] = [];
  allProfiles: UserProfile[] = [];

  ngOnInit(): void {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub();
      if (!user) { this.router.navigate(['/']); return; }
      this.myUid = user.uid;

      // Real-time listener for all users
      this.unsubscribeSnapshot = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          this.allProfiles = snap.docs.map((d) => ({
            uid: d.id,
            profileName: d.data()['profileName'] ?? '',
            avatarUrl: d.data()['avatarUrl'],
            hangingWith: d.data()['hangingWith'] ?? [],
          }));
          const me = this.allProfiles.find(p => p.uid === this.myUid);
          this.myHangingWith = [...(me?.hangingWith ?? [])];
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        (err) => { console.error('[HangingWith]', err); }
      );
    });
  }

  ngOnDestroy(): void { this.unsubscribeSnapshot?.(); }

  isHangingWith(uid: string): boolean {
    return this.myHangingWith.includes(uid);
  }

  async toggleHangingWith(uid: string): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;
    const updated = this.myHangingWith.includes(uid)
      ? this.myHangingWith.filter(u => u !== uid)
      : [...this.myHangingWith, uid];
    this.myHangingWith = updated;
    this.cdr.detectChanges();
    try {
      await updateDoc(doc(db, 'users', this.myUid), { hangingWith: updated });
    } catch (err) {
      console.error('[HangingWith] save error:', err);
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  /** Cluster users using BFS on bidirectional hangingWith connections. Only shows groups of 2+. */
  get clusters(): UserProfile[][] {
    // Build undirected adjacency: if A marks B, they're connected regardless of whether B marks A
    const adj = new Map<string, Set<string>>();
    for (const p of this.allProfiles) {
      if (!adj.has(p.uid)) adj.set(p.uid, new Set());
      for (const uid of (p.hangingWith ?? [])) {
        adj.get(p.uid)!.add(uid);
        if (!adj.has(uid)) adj.set(uid, new Set());
        adj.get(uid)!.add(p.uid);
      }
    }

    // BFS to find connected components
    const seen = new Set<string>();
    const result: UserProfile[][] = [];

    for (const profile of this.allProfiles) {
      if (seen.has(profile.uid)) continue;
      // Skip users with no connections at all
      if ((adj.get(profile.uid)?.size ?? 0) === 0) { seen.add(profile.uid); continue; }

      const group: UserProfile[] = [];
      const queue = [profile.uid];
      seen.add(profile.uid);

      while (queue.length > 0) {
        const uid = queue.shift()!;
        const p = this.allProfiles.find(x => x.uid === uid);
        if (p) group.push(p);
        for (const neighbor of (adj.get(uid) ?? [])) {
          if (!seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
        }
      }

      if (group.length >= 2) result.push(group);
    }

    return result;
  }

  get eligibleProfiles(): UserProfile[] {
    return this.allProfiles.filter(p => p.uid !== this.myUid);
  }

  avatarUrl(p: UserProfile): string {
    return p.avatarUrl || `https://api.dicebear.com/8.x/thumbs/svg?seed=${p.profileName}`;
  }

  goHome(): void { this.router.navigate(['/home']); }
}
