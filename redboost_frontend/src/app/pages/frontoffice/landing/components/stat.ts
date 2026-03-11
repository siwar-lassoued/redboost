/* import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../../environment';

interface Stat {
    target: number;
    label: string;
    suffix?: string;
}

@Component({
    selector: 'app-stat',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="stats-container">
            <div class="stat-card" *ngFor="let stat of stats; let i = index">
                <div class="card-content">
                    <h1>
                        +{{ currentNumbers[i] | number: '1.0-0'
                        }}<span *ngIf="stat.suffix">{{ stat.suffix }}</span>
                    </h1>
                    <p>{{ stat.label }}</p>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .stats-container {
                display: flex;
                justify-content: space-between;
                align-items: stretch;
                background: #ffffff;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
                max-width: 1200px;
                margin: 0 auto;
                font-family: 'Helvetica Neue', sans-serif;
                gap: 25px;
            }

            .stat-card {
                text-align: center;
                flex: 1;
                background: linear-gradient(135deg, #c8223a, #a71931);
                border-radius: 12px;
                transition: all 0.3s ease;
                padding: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }

            .stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: rgba(255, 255, 255, 0.3);
            }

            .card-content {
                padding: 25px 20px;
            }

            .stat-card:hover {
                transform: translateY(-5px) scale(1.02);
                box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);
            }

            h1 {
                font-size: 2.8em;
                margin: 0 0 8px 0;
                font-weight: 700;
                color: #ffffff;
                line-height: 1.2;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            h1 span {
                font-size: 0.6em;
                vertical-align: super;
                color: rgba(255, 255, 255, 0.85);
            }

            p {
                font-size: 1.1em;
                margin: 0;
                color: rgba(255, 255, 255, 0.9);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                font-weight: 500;
            }

            @media (max-width: 992px) {
                .stats-container {
                    gap: 20px;
                    padding: 30px;
                }

                .card-content {
                    padding: 20px 15px;
                }

                h1 {
                    font-size: 2.4em;
                }
            }

            @media (max-width: 768px) {
                .stats-container {
                    flex-direction: column;
                    padding: 25px;
                    gap: 20px;
                }

                .stat-card {
                    width: 100%;
                    margin-bottom: 0;
                }

                .card-content {
                    padding: 20px;
                }

                h1 {
                    font-size: 2.6em;
                }
            }

            @media (max-width: 480px) {
                .stats-container {
                    padding: 20px 15px;
                    gap: 15px;
                }

                .card-content {
                    padding: 18px 12px;
                }

                h1 {
                    font-size: 2.2em;
                }

                p {
                    font-size: 1em;
                    letter-spacing: 1px;
                }
            }
        `,
    ],
})
export class StatComponent implements OnInit {
    private http = inject(HttpClient);
    private apiBaseUrl = environment.apiUrl; // Use environment variable

    stats: Stat[] = [];
    currentNumbers: number[] = [];

    ngOnInit() {
        forkJoin({
            projects: this.http.get<{ count: number }>(
                `${this.apiBaseUrl}/projets/count`,
            ),
            entrepreneurs: this.http.get<{ count: number }>(
                `${this.apiBaseUrl}/users/entrepreneurs/count`,
            ),
            coaches: this.http.get<{ count: number }>(
                `${this.apiBaseUrl}/users/coaches/count`,
            ),
        }).subscribe({
            next: (results) => {
                this.stats = [
                    { target: results.projects.count, label: 'Projets' },
                    {
                        target: results.entrepreneurs.count,
                        label: 'Entrepreneurs',
                    },
                    { target: results.coaches.count, label: 'Coachs' },
                ];
                this.currentNumbers = new Array(this.stats.length).fill(0);
                this.stats.forEach((stat, index) => {
                    this.countUp(index, stat.target);
                });
            },
            error: (err) => {
                console.error('Error fetching stats:', err);
                this.stats = [
                    { target: 0, label: 'Projets' },
                    { target: 0, label: 'Entrepreneurs' },
                    { target: 0, label: 'Coachs' },
                ];
                this.currentNumbers = new Array(this.stats.length).fill(0);
            },
        });
    }

    countUp(index: number, target: number) {
        const duration = 2500;
        const steps = 120;
        const increment = target / steps;
        const intervalTime = duration / steps;
        let current = 0;

        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            this.currentNumbers[index] = Math.floor(current);
        }, intervalTime);
    }
}
 */