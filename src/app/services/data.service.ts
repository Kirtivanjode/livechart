import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private lastUpdated = new BehaviorSubject<Date | null>(null);
  lastUpdated$ = this.lastUpdated.asObservable();

  updateTimestamp() {
    this.lastUpdated.next(new Date());
  }
}
