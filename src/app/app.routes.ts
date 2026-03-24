import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { SelectProfileComponent } from './component/selectProfile/select-profile.component';
import { HomeComponent } from './component/home/home.component';
import { DrinkingComponent } from './component/drinking/drinking.component';
import { PicturesComponent } from './component/pictures/pictures.component';
import { ObjectiveComponent } from './component/objective/objective.component';
import { ChecklistComponent } from './component/checklist/checklist.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'select-profile', component: SelectProfileComponent, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'drinks', component: DrinkingComponent, canActivate: [authGuard] },
  { path: 'pictures', component: PicturesComponent, canActivate: [authGuard] },
  { path: 'objective', component: ObjectiveComponent, canActivate: [authGuard] },
  { path: 'checklist', component: ChecklistComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
