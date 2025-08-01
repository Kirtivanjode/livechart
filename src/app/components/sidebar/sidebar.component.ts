import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import {
  Router,
  RouterLink,
  RouterModule,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [
    MatIcon,
    CommonModule,
    RouterLink,
    MatIconModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  @Input() collapsed = false;

  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('isLoggedIn'); // or any auth flag
    this.router.navigate(['/']);
  }
}
