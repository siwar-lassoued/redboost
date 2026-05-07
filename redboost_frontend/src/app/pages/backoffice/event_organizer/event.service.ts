// event.service.ts
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environment';

export interface CreateEventRequest {
  title: string;
  description: string;
  startDateTime: string; // ISO format
  endDateTime: string;
  type: string;
  mode: string;
  location: string;
  program: string;
  participantEmails: string[];
}

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  type: string;
  mode: string;
  location: string;
  meetLink?: string;
  program: string;
  participantEmails: string[];
  googleCalendarEventId: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) {}

  createEvent(event: CreateEventRequest): Observable<EventResponse> {
    return this.http.post<EventResponse>(this.apiUrl, event);
  }

  getAllEvents(): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(this.apiUrl);
  }

  getEventsByMonth(year: number, month: number): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(`${this.apiUrl}/month?year=${year}&month=${month}`);
  }

  getEvent(id: number): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${this.apiUrl}/${id}`);
  }

  updateEvent(id: number, event: CreateEventRequest): Observable<EventResponse> {
    return this.http.put<EventResponse>(`${this.apiUrl}/${id}`, event);
  }

  cancelEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEventsByParticipant(email: string): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(`${this.apiUrl}/participant/${email}`);
  }
}