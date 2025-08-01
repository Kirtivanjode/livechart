import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { DataTablesModule } from 'angular-datatables';
import { Subject } from 'rxjs';
import * as ExcelJS from 'exceljs';
import * as FileSaver from 'file-saver';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatIcon,
    DataTablesModule,
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
})
export class ReportComponent implements OnInit, OnDestroy {
  selectedChart = 'X1';
  selectedType = 'line';
  selectedDate = new Date();
  tableData: { timestamp: string; values: number[] }[] = [];

  subVariables = [1, 2, 3, 4, 5, 6];
  metrics = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6'];
  dtOptions: any = {};
  dtTrigger: Subject<any> = new Subject();

  chartColor: string = '#6c5ce7'; // fallback

  constructor(private route: ActivatedRoute, private elRef: ElementRef) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.selectedChart = params['chart'] || 'X1';
      this.selectedType = params['type'] || 'bar';
      this.chartColor = params['color'] || '#6c5ce7'; // fallback purple
      this.updateCSSVariable('--chartColor', this.chartColor);
      this.fetchTableData();
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }

  updateCSSVariable(name: string, value: string): void {
    this.elRef.nativeElement.style.setProperty(name, value);
  }

  fetchTableData(): void {
    const storageKey = `chartData-${this.selectedChart}-${this.selectedType}`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      this.tableData = [];
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const alignedData: { [timestamp: string]: number[] } = {};

      parsed.forEach((sub: any, subIndex: number) => {
        sub.dataPoints.forEach((dp: any) => {
          const timestamp = new Date(dp.x).toLocaleString();
          if (!alignedData[timestamp]) {
            alignedData[timestamp] = Array(parsed.length).fill(null);
          }
          alignedData[timestamp][subIndex] = dp.y;
        });
      });

      this.tableData = Object.entries(alignedData).map(
        ([timestamp, values]) => ({
          timestamp,
          values: values.map((v) => +(v ?? 0).toFixed(2)),
        })
      );

      this.tableData.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (err) {
      console.error('Failed to parse localStorage data', err);
      this.tableData = [];
    }
  }

  exportToExcel(): void {
    if (this.tableData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    const headers = [
      'Timestamp',
      ...this.subVariables.map((num) => `${this.selectedChart}-${num}`),
    ];
    worksheet.addRow(headers);

    this.tableData.forEach((row) => {
      worksheet.addRow([row.timestamp, ...row.values]);
    });

    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      const maxLength = Math.max(
        header.length,
        ...this.tableData.map((row) =>
          index === 0
            ? row.timestamp.length
            : row.values[index - 1]?.toString().length || 0
        )
      );
      column.width = maxLength + 4;
    });

    const endCol = worksheet.getColumn(headers.length).letter;
    worksheet.mergeCells(`A1:${endCol}1`);
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Report - ${this.selectedChart} (${this.selectedType})`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.spliceRows(2, 0, headers);

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      FileSaver.saveAs(
        blob,
        `Report-${this.selectedChart}-${this.selectedType}.xlsx`
      );
    });
  }
}
