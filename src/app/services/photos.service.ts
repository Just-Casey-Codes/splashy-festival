import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  orderBy,
  serverTimestamp,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface PhotoEntry {
  id?: string;
  uid: string;
  profileName: string;
  avatarUrl?: string;
  imageUrl: string;
  uploadedAt: any;
}

@Injectable({ providedIn: 'root' })
export class PhotosService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);

  getAllPhotos(): Observable<PhotoEntry[]> {
    const photosRef = collection(this.firestore, 'photos');
    const q = query(photosRef, orderBy('uploadedAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<PhotoEntry[]>;
  }

  async uploadPhoto(
    file: File,
    uid: string,
    profileName: string,
    avatarUrl: string
  ): Promise<void> {
    const timestamp = Date.now();
    const storageRef = ref(this.storage, `photos/${uid}/${timestamp}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    await new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, async () => {
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(this.firestore, 'photos'), {
          uid,
          profileName,
          avatarUrl,
          imageUrl,
          uploadedAt: serverTimestamp(),
        });
        resolve();
      });
    });
  }
}
