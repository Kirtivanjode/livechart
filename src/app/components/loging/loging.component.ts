import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loging',
  imports: [CommonModule, FormsModule],
  templateUrl: './loging.component.html',
  styleUrl: './loging.component.css',
})
export class LogingComponent {
  email: string = '';
  password: string = '';
  errorMsg: string = '';

  constructor(private router: Router) {}

  login(): void {
    if (this.email === 'admin@company.com' && this.password === '12345') {
      this.errorMsg = '';
      this.router.navigate(['/dashboard']); // Change route if needed
    } else {
      this.errorMsg = 'Invalid email or password';
    }
  }

  isFormValid(): boolean {
    return this.email.trim() !== '' && this.password.trim() !== '';
  }
}
