import { Component, OnInit } from '@angular/core';
import { UserService } from '../../frontoffice/service/UserService';
import { CoachRequest } from '../../../models/coach-request.model';

@Component({
    selector: 'app-coach-requests',
    templateUrl: './coach-requests.component.html',
    styleUrls: ['./coach-requests.component.scss'],
})
export class CoachRequestsComponent implements OnInit {
    requests: CoachRequest[] = [];
    errorMessage: string | null = null; // To display errors

    constructor(private userService: UserService) {}

    ngOnInit(): void {
        this.loadRequests();
    }

    loadRequests(): void {
        this.errorMessage = null; // Reset error message
        this.userService.getAllCoachRequests().subscribe({
            next: (data) => (this.requests = data),
            error: (err) => {
                this.errorMessage =
                    'Failed to load coach requests. Please try again later.';
                console.error('Failed to load requests', err);
            },
        });
    }

    approveRequest(requestId: number): void {
        this.userService.approveCoachRequest(requestId).subscribe({
            next: () => this.loadRequests(),
            error: (err) => {
                this.errorMessage =
                    'Failed to approve request. Please try again.';
                console.error('Failed to approve request', err);
            },
        });
    }

    rejectRequest(requestId: number): void {
        this.userService.rejectCoachRequest(requestId).subscribe({
            next: () => this.loadRequests(),
            error: (err) => {
                this.errorMessage =
                    'Failed to reject request. Please try again.';
                console.error('Failed to reject request', err);
            },
        });
    }
}
