import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { interval, Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, CanvasJSAngularChartsModule, FormsModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate(
          '300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'translateY(10px)' })
        ),
      ]),
    ]),
  ],
})
export class ChartComponent {
  metricId: string = '';
  chartType: string = 'line';
  chartOptions: any;
  subVars: any[] = [];
  chartInstance: any = null;
  intervalSub!: Subscription;
  justSwitched: boolean = false;
  showChart = true;

  colorPalette: string[] = [
    '#3b82f6',
    '#ef4444',
    '#84cc16',
    '#06b6d4',
    '#8b5cf6',
    '#0ea5e9',
  ];

  yAxisRanges: { [key: string]: number } = {
    X1: 120,
    X2: 25,
    X3: 120,
    X4: 100,
    X5: 1000,
    X6: 120,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.metricId = this.route.snapshot.paramMap.get('id') || 'X1';
    this.chartType =
      sessionStorage.getItem(`chartType-${this.metricId}`) || 'line';

    this.initSubVars();
    this.loadFromLocalStorage();
    this.updateChartOptions();
    this.pushData();

    this.intervalSub = interval(5000).subscribe(() => this.pushData());
    // 👇 Add here
    this.logStoredChartDataKeys();
  }

  ngOnDestroy(): void {
    this.intervalSub?.unsubscribe();
  }

  initSubVars() {
    this.subVars = [];
    for (let i = 1; i <= 6; i++) {
      this.subVars.push({
        name: `${this.metricId}-${i}`,
        color: this.colorPalette[i - 1],
        dataPoints: [],
        latestY: 0,
      });
    }
  }

  getRandom(id: string): number {
    switch (id) {
      case 'X1':
        return +(Math.random() * 100).toFixed(2);
      case 'X2':
        return +(8 + Math.random() * 8).toFixed(2);
      case 'X3':
        return +(10 + Math.random() * 90).toFixed(2);
      case 'X4':
        return +(40 + Math.random() * 40).toFixed(2);
      case 'X5':
        return +(100 + Math.random() * 900).toFixed(2);
      case 'X6':
        return +(Math.random() * 100).toFixed(2);
      default:
        return 0;
    }
  }

  pushData() {
    const now = new Date();
    const maxPoints = 20;
    const newYValues = this.subVars.map(() => this.getRandom(this.metricId));

    this.subVars.forEach((sub, index) => {
      const point = { x: now, y: newYValues[index] };

      sub.dataPoints.push(point);
      if (sub.dataPoints.length > maxPoints) sub.dataPoints.shift();

      sub.latestY = point.y;
    });

    if (this.chartType === 'bar') {
      const newBarData = this.subVars.map((sub) => {
        const latestPoint = sub.dataPoints[sub.dataPoints.length - 1];
        const yValue = latestPoint?.y || 0;
        return {
          label: sub.name,
          y: yValue,
          color: sub.color,
          indexLabel: `${yValue.toFixed(2)}`,
          indexLabelFontColor: '#ffffff',
          indexLabelFontSize: 14,
          indexLabelFontWeight: 'bold',
          indexLabelPlacement: 'inside',
          indexLabelOrientation: 'horizontal',
        };
      });
      this.chartOptions.data[0].dataPoints = newBarData;
    } else {
      const min = new Date(now.getTime() - 60000);
      const max = new Date(now.getTime() + 5000);

      this.chartOptions.axisX.viewportMinimum = min;
      this.chartOptions.axisX.viewportMaximum = max;

      this.chartOptions.data.forEach((series: any, index: number) => {
        series.dataPoints = [...this.subVars[index].dataPoints];
      });
    }

    this.chartInstance?.render();
    this.saveToLocalStorage();
    this.dataService.updateTimestamp();
  }

  updateChartOptions(justSwitched = false) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (this.chartType === 'bar') {
      const barData = this.subVars.map((sub) => {
        const latestPoint = sub.dataPoints[sub.dataPoints.length - 1];
        const yValue = latestPoint?.y || 0;
        const isSmall = yValue < (this.yAxisRanges[this.metricId] || 100) * 0.1;

        return {
          label: sub.name,
          y: yValue,
          color: sub.color,
          indexLabel: `${yValue.toFixed(2)}`,
          indexLabelFontColor: isSmall ? '#000000' : '#ffffff',
          indexLabelFontSize: 14,
          indexLabelFontWeight: 'bold',
          indexLabelPlacement: isSmall ? 'outside' : 'inside',
          indexLabelOrientation: 'horizontal',
        };
      });

      this.chartOptions = {
        animationEnabled: true,
        title: { text: `📊 Bar Chart for ${this.metricId} — ${dateStr}` },
        axisY: {
          title: 'Value',
          includeZero: true,
          maximum: this.yAxisRanges[this.metricId] || 100,
        },
        axisX: { title: 'Sub Variables' },
        toolTip: {
          shared: true,
          backgroundColor: '#ffffff',
          borderColor: '#ccc',
          fontColor: '#000',
          contentFormatter: (e: any) => {
            return e.entries
              .map(
                (entry: any) =>
                  `<div style="color:${
                    entry.dataPoint.color
                  }; font-weight:bold;">
                  🔹 ${entry.dataPoint.label}: ${entry.dataPoint.y.toFixed(2)} 
                </div>`
              )
              .join('');
          },
        },
        data: [
          {
            type: 'bar',
            dataPoints: barData,
          },
        ],
      };
    } else {
      const min = new Date(now.getTime() - 60000);
      const max = new Date(now.getTime() + 5000);

      this.chartOptions = {
        animationEnabled: !justSwitched,
        zoomEnabled: true,
        zoomType: 'xy',
        title: { text: `📈 Line Chart for ${this.metricId} — ${dateStr}` },
        axisX: {
          title: 'Time (Live)',
          valueFormatString: 'hh:mm:ss TT',
          interval: 5,
          intervalType: 'second',
          labelAngle: -30,
          labelFontSize: 14,
          labelAutoFit: true,
          viewportMinimum: min,
          viewportMaximum: max,
          scrollbar: { enabled: true },
        },
        axisY: { title: 'Value' },
        toolTip: {
          shared: true,
          xValueFormatString: 'hh:mm:ss TT',
        },
        legend: {
          cursor: 'pointer',
          itemclick: function (e: any) {
            e.dataSeries.visible = !e.dataSeries.visible;
            e.chart.render();
          },
        },
        navigator: {
          enabled: true,
          slider: {
            minimum: min,
            maximum: max,
          },
        },
        data: this.subVars.map((sub) => ({
          type: 'line',
          showInLegend: true,
          name: sub.name,
          dataPoints: [...sub.dataPoints],
          xValueFormatString: 'hh:mm:ss TT',
          connectNullData: true,
          color: sub.color,
        })),
      };
    }
  }
  logStoredChartDataKeys(): void {
    const chartDataKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith('chartData-')
    );

    console.log(`📦 Total saved chart datasets: ${chartDataKeys.length}`);

    chartDataKeys.forEach((key, index) => {
      console.log(`\n${index + 1}. 🔑 Key: ${key}`);
      try {
        const stored = localStorage.getItem(key);
        if (!stored) {
          console.warn('   ⚠️ No data found');
          return;
        }
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) {
          console.warn('   ⚠️ Malformed data');
          return;
        }

        console.log(`   ➤ SubVars: ${parsed.length}`);
        parsed.forEach((sub: any, idx: number) => {
          console.log(`      - ${sub.name} (${sub.dataPoints.length} points)`);
        });
      } catch (e) {
        console.warn(`   ❌ Error parsing JSON for key: ${key}`, e);
      }
    });
  }

  saveToLocalStorage() {
    const dataToStore = this.subVars.map((sub) => ({
      name: sub.name,
      color: sub.color,
      dataPoints: sub.dataPoints.map((dp: any) => ({
        x: dp.x.toISOString(),
        y: dp.y,
      })),
    }));
    const storageKey = `chartData-${this.metricId}-${this.chartType}`;
    localStorage.setItem(storageKey, JSON.stringify(dataToStore));
  }

  loadFromLocalStorage() {
    const storageKey = `chartData-${this.metricId}-${this.chartType}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.subVars = parsed.map((sub: any, index: number) => ({
        name: sub.name,
        color: sub.color || this.colorPalette[index],
        dataPoints: sub.dataPoints.map((dp: any) => ({
          x: new Date(dp.x),
          y: dp.y,
        })),
        latestY: sub.dataPoints[sub.dataPoints.length - 1]?.y ?? 0,
      }));
    }
  }

  onChartInstance(chart: any): void {
    this.chartInstance = chart;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onChartTypeChange(type: string) {
    this.intervalSub?.unsubscribe();
    sessionStorage.setItem(`chartType-${this.metricId}`, type);
    this.chartType = type;
    this.justSwitched = true;

    this.chartInstance = null;
    this.subVars = [];

    this.loadFromLocalStorage();

    if (this.subVars.length === 0 || this.subVars[0].dataPoints.length === 0) {
      this.initSubVars();
    }

    this.updateChartOptions(true);

    this.showChart = false;
    setTimeout(() => {
      this.showChart = true;
      this.pushData();
    }, 0);

    this.intervalSub = interval(5000).subscribe(() => this.pushData());
    setTimeout(() => (this.justSwitched = false), 500);
  }

  getColorFromChart(subName: string): string {
    const sub = this.subVars.find((s) => s.name === subName);
    return sub?.color || '#16a34a';
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

  metric = Array.from({ length: 6 }, (_, i) => ({
    id: `X${i + 1}`,
    label: `Metric ${i + 1}`,
    color: this.getColor(i + 1),
  }));
}
