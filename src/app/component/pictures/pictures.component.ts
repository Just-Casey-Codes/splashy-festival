import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
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
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private photosService = inject(PhotosService);

  photos: PhotoEntry[] = [];
  isUploading = false;
  uploadProgress = 0;
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  uid = '';
  profileName = '';
  avatarUrl = '';

  private sub?: Subscription;

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) { this.router.navigate(['/']); return; }
    this.uid = user.uid;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      this.profileName = data.profileName;
      this.avatarUrl = data.avatarUrl;
    }

    this.sub = this.photosService.getAllPhotos().subscribe((photos) => {
      this.photos = photos;
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
    reader.onload = (e) => { this.previewUrl = e.target?.result as string; };
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
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      this.isUploading = false;
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
