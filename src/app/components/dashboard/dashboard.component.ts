import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  constructor(private router: Router, private dataService: DataService) {}

  metrics = Array.from({ length: 6 }, (_, i) => ({
    id: `X${i + 1}`,
    label: `Metric ${i + 1}`,
    color: this.getColor(i + 1),
  }));

  openChart(metric: any): void {
    this.router.navigate(['/chart', metric.id]);
  }

  getColor(index: number): string {
    const colors = [
      '#3f51b5',
      '#4caf50',
      '#ff9800',
      '#9c27b0',
      '#f44336',
      '#00bcd4',
    ];
    return colors[(index - 1) % colors.length];
  }
}
