import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  public rendezVousUpdates$ = new Subject<any>();

  constructor() {
    console.warn('Mock WebSocketService initialized. A real implementation is needed.');
  }

  public initialize(role: any, id: number): void {
    console.log(`WebSocketService initialized with role: ${role}, id: ${id}`);
  }
}
