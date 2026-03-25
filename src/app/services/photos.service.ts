import { Injectable } from '@angular/core';
import { db, storage } from '../../firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  getAllPhotos(): Observable<PhotoEntry[]> {
    const photosRef = collection(db, 'photos');
    return from(getDocs(photosRef)).pipe(
      map((snap) =>
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<PhotoEntry, 'id'>) }))
          .sort((a, b) => {
            const aTime = a.uploadedAt?.seconds ?? 0;
            const bTime = b.uploadedAt?.seconds ?? 0;
            return bTime - aTime;
          })
      )
    );
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
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async uploadPhoto(
    file: File,
    uid: string,
    profileName: string,
    avatarUrl: string
  ): Promise<void> {
    console.log('[Photos] Step 1: compressing image...');
    const compressed = await this.compressImage(file);
    console.log('[Photos] Step 2: compressed to', compressed.size, 'bytes');

    const timestamp = Date.now();
    const storageRef = ref(storage, `photos/${uid}/${timestamp}.jpg`);

    console.log('[Photos] Step 3: uploading to Storage...');
    const snapshot = await uploadBytes(storageRef, compressed, { contentType: 'image/jpeg' });
    console.log('[Photos] Step 4: upload done, getting download URL...');

    const imageUrl = await getDownloadURL(snapshot.ref);
    console.log('[Photos] Step 5: got URL, saving to Firestore...');

    await addDoc(collection(db, 'photos'), {
      uid,
      profileName,
      avatarUrl,
      imageUrl,
      uploadedAt: serverTimestamp(),
    });
    console.log('[Photos] Step 6: saved to Firestore. Done!');
  }
}