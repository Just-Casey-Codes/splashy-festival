import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PhotosService, PhotoEntry } from '../../services/photos.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pictures',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pictures.component.html',
  styleUrls: ['./pictures.component.css'],
})
export class PicturesComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private photosService = inject(PhotosService);
  private cdr = inject(ChangeDetectorRef);

  photos: PhotoEntry[] = [];
  isUploading = false;
  uploadProgress = 0;
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  uid = '';
  profileName = '';
  avatarUrl = '';

  private sub?: Subscription;

  ngOnInit(): void {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      try {
        if (!user) { this.router.navigate(['/']); return; }
        this.uid = user.uid;

        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          this.profileName = data.profileName;
          this.avatarUrl = data.avatarUrl;
        }

        this.loadPhotos();
        this.cdr.detectChanges();
      } catch (err) {
        console.error('[Pictures] Error:', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadPhotos(): void {
    this.sub?.unsubscribe();
    this.sub = this.photosService.getAllPhotos().subscribe({
      next: (photos) => { this.photos = photos; this.cdr.detectChanges(); },
      error: (err) => { console.error('[Pictures] photos load error:', err); }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.selectedFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(this.selectedFile);
  }

  async uploadPhoto(): Promise<void> {
    if (!this.selectedFile || this.isUploading) return;
    this.isUploading = true;
    try {
      await this.photosService.uploadPhoto(
        this.selectedFile,
        this.uid,
        this.profileName,
        this.avatarUrl
      );
      this.selectedFile = null;
      this.previewUrl = null;
      this.loadPhotos();
    } catch (err) {
      console.error('[Pictures] Upload failed:', err);
      alert('Upload failed: ' + (err instanceof Error ? err.message : JSON.stringify(err)));
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
    }
  }

  cancelPreview(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
