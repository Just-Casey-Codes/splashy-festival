import { Component, OnInit, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface CheckItem {
  label: string;
}

interface CheckCategory {
  title: string;
  items: CheckItem[];
}

export const CHECKLIST: CheckCategory[] = [
  {
    title: '🧥 Clothes & Outfits',
    items: [
      { label: 'Main outfits (comfy + cute!)' },
      { label: 'Warm hoodie/jacket (nights get chilly ❄️)' },
      { label: 'Pajamas / sleepwear' },
      { label: 'Extra underwear & socks' },
      { label: 'Swimsuit (just in case 💦)' },
      { label: 'Hat / bucket hat / cap 🧢' },
      { label: 'Sunglasses 😎' },
      { label: 'Rain poncho / light jacket ☔' },
    ],
  },
  {
    title: '👟 Shoes',
    items: [
      { label: 'Comfy walking shoes (VERY important!!)' },
      { label: 'Sandals / slip-ons' },
      { label: 'Flip flops (for showers 🚿)' },
    ],
  },
  {
    title: '🧴 Toiletries',
    items: [
      { label: 'Toothbrush & toothpaste' },
      { label: 'Face wash & moisturizer' },
      { label: 'Deodorant' },
      { label: 'Sunscreen ☀️' },
      { label: 'Lip balm' },
      { label: 'Wet wipes / baby wipes (lifesaver!!)' },
      { label: 'Hand sanitizer' },
    ],
  },
  {
    title: '🎒 Essentials',
    items: [
      { label: 'Festival ticket 🎟️' },
      { label: 'ID / driver\'s license' },
      { label: 'Cash + bank card' },
      { label: 'Phone & charger 🔌' },
      { label: 'Power bank 🔋' },
      { label: 'Small backpack / bumbag' },
    ],
  },
  {
    title: '⛺ Camping Gear',
    items: [
      { label: 'Tent' },
      { label: 'Sleeping bag 💤' },
      { label: 'Pillow / blanket' },
      { label: 'Camping chair' },
      { label: 'Torch / flashlight 🔦' },
    ],
  },
  {
    title: '🍿 Food & Drinks',
    items: [
      { label: 'Snacks' },
      { label: 'Reusable water bottle 💧' },
      { label: 'Electrolytes / rehydration sachets' },
    ],
  },
  {
    title: '💄 Extras & Fun Stuff',
    items: [
      { label: 'Glitter / face gems ✨' },
      { label: 'Makeup' },
      { label: 'Hair ties / clips' },
      { label: 'Portable mirror' },
      { label: 'Cute accessories (bracelets, rings 💖)' },
    ],
  },
];

@Component({
  selector: 'app-checklist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.css'],
})
export class ChecklistComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  categories = CHECKLIST;
  checked: Record<string, boolean> = {};
  isLoading = true;
  uid = '';

  get totalItems(): number {
    return this.categories.reduce((s, c) => s + c.items.length, 0);
  }

  get checkedCount(): number {
    return Object.values(this.checked).filter(Boolean).length;
  }

  get progressPct(): number {
    return this.totalItems ? Math.round((this.checkedCount / this.totalItems) * 100) : 0;
  }

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) { this.router.navigate(['/']); return; }
    this.uid = user.uid;

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      this.checked = (snap.data()['checklist'] as Record<string, boolean>) ?? {};
    }
    this.isLoading = false;
  }

  itemKey(catIndex: number, itemIndex: number): string {
    return `${catIndex}_${itemIndex}`;
  }

  isChecked(catIndex: number, itemIndex: number): boolean {
    return !!this.checked[this.itemKey(catIndex, itemIndex)];
  }

  async toggle(catIndex: number, itemIndex: number): Promise<void> {
    const key = this.itemKey(catIndex, itemIndex);
    this.checked[key] = !this.checked[key];
    const userRef = doc(this.firestore, `users/${this.uid}`);
    await updateDoc(userRef, { checklist: { ...this.checked } });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
