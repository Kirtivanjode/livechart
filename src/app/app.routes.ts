import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChartComponent } from './components/chart/chart.component';
import { ReportComponent } from './components/report/report.component';
import { LogingComponent } from './components/loging/loging.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', component: LogingComponent },

  // Protected routes:
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  { path: 'chart/:id', component: ChartComponent, canActivate: [authGuard] },
  { path: 'report', component: ReportComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '' },
];
