import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environment';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `
        <ul class="layout-menu">
            <ng-container *ngFor="let item of model; let i = index">
                <li
                    app-menuitem
                    *ngIf="!item.separator"
                    [item]="item"
                    [index]="i"
                    [root]="true"
                ></li>
                <li *ngIf="item.separator" class="menu-separator"></li>
            </ng-container>
        </ul>
    `,
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService,
    ) {}

    ngOnInit(): void {
        this.fetchUserRoleAndSetMenu();
    }

    private fetchUserRoleAndSetMenu(): void {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Jeton introuvable. Connectez-vous.',
            });
            this.router.navigate(['/signin']);
            return;
        }

        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

        this.http
            .get(`${environment.apiUrl}/users/profile`, { headers })
            .subscribe({
                next: (response: any) => this.setMenuBasedOnRole(response.role),
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de récupérer le rôle utilisateur',
                    });
                    this.router.navigate(['/signin']);
                },
            });
    }

    private setMenuBasedOnRole(role: string): void {
        switch (role) {
            case 'ENTREPRENEUR':
                this.model = this.getEntrepreneurMenu();
                break;
            case 'COACH':
                this.model = this.getCoachMenu();
                break;
            case 'SUPERADMIN':
                this.model = this.getSuperAdminMenu();
                break;
            case 'ADMIN':
                this.model = this.getAdminMenu();
                break;
            default:
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Avertissement',
                    detail: 'Rôle utilisateur inconnu',
                });
        }
    }

    private getSuperAdminMenu(): MenuItem[] {
        return [
            {
                label: 'ACCUEIL',
                icon: 'pi pi-fw pi-home',
                items: [
                    {
                        label: 'Vue globale',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/dashboardglobal'],
                    },
                ],
            },
            {
                label: 'CALENDRIER',
                icon: 'pi pi-fw pi-calendar',
                routerLink: ['/calendar'],
            },
            {
                label: 'PROGRAMMES',
                icon: 'pi pi-fw pi-folder',
                items: [
                    {
                        label: 'Mes programmes',
                        icon: 'pi pi-fw pi-folder',
                        routerLink: ['/programme'],
                    },
                    {
                        label: 'Gestion des entrepreneurs',
                        icon: 'pi pi-fw pi-folder',
                        routerLink: ['/gestion-entrepreneur'],
                    },
                    {
                        label: 'Mes tâches et activités',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/mes-taches'],
                    },
                    {
                        label: 'Gestion des sprints',
                        icon: 'pi pi-fw pi-chart-line',
                        routerLink: ['/dashbsprint'],
                    },
                    {
                        label: 'Catégories & KPI',
                        icon: 'pi pi-fw pi-bullseye',
                        routerLink: ['/backoffice_cat_kpi'],
                    },
                ],
            },
            
            {
                label: 'BASE DE DONNÉES',
                icon: 'pi pi-fw pi-database',
                items: [
                     {
                        label: 'Templates ',
                        icon: 'pi pi-fw pi-tags',
                        routerLink: ['/suivitemplate'],
                    },
                    {
                        label: 'Insertion données',
                        icon: 'pi pi-fw pi-tags',
                        routerLink: ['/insertdata'],
                    },
                    {
                        label: 'Filtrer données',
                        icon: 'pi pi-fw pi-filter',
                        routerLink: ['/data_filter'],
                    },
                ],
            },
            {
                label: 'UTILISATEURS',
                icon: 'pi pi-fw pi-users',
                items: [
                    {
                        label: 'Gestion',
                        icon: 'pi pi-fw pi-user-edit',
                        routerLink: ['/all-users'],
                    },
                    /* {
                        label: 'Liste',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/all-coach-requests'],
                    },
                    {
                        label: 'Affecter coach',
                        icon: 'pi pi-fw pi-user-plus',
                        routerLink: ['/Assign-coach'],
                    }, */
                ],
            },
            {
                label: 'CANDIDATURES',
                icon: 'pi pi-fw pi-id-card',
                items: [
                    {
                        label: 'Gestion',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/admin_redstarter'],
                    },
                    {
                        label: 'Historique',
                        icon: 'pi pi-fw pi-history',
                        routerLink: ['/admin_historique'],
                    },
                ],
            },
            {
                label: 'MATCHING IA',
                icon: 'pi pi-fw pi-bolt',
                routerLink: ['/admin_matching'],
            },
        ];
    }

    private getAdminMenu(): MenuItem[] {
        return this.getSuperAdminMenu();
    }

    private getEntrepreneurMenu(): MenuItem[] {
        return [
            {
                label: 'ACCUEIL',
                icon: 'pi pi-fw pi-home',
                items: [
                    {
                        label: 'Tableau de bord',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/entrepreneur-dashboard'],
                    },
                ],
            },
            {
                label: 'CALENDRIER',
                icon: 'pi pi-fw pi-calendar',
                routerLink: ['/entrep-calendar'],
            },
            {
                label: 'PROJETS',
                icon: 'pi pi-fw pi-folder',
                items: [
                    {
                        label: 'Nouveau projet',
                        icon: 'pi pi-fw pi-plus',
                        routerLink: ['/addprojet'],
                    },
                    {
                        label: 'Mes projets',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/GetProjet'],
                    },
                ],
            },
            {
                label: 'LIVRABLES',
                icon: 'pi pi-fw pi-file',
                routerLink: ['/entrep-deliverable'],
            },
            {
                label: 'DOCUMENTS',
                icon: 'pi pi-fw pi-book',
                items: [
                    {
                        label: 'Détails',
                        icon: 'pi pi-fw pi-info-circle',
                        routerLink: ['/ShowEntreDoc'],
                    },
                    {
                        label: 'Tâches',
                        icon: 'pi pi-fw pi-tasks',
                        routerLink: ['/projects/:projectId/documents'],
                    },
                ],
            },
            {
                label: 'COMMUNICATION',
                icon: 'pi pi-fw pi-comments',
                items: [
                    {
                        label: 'Messagerie',
                        icon: 'pi pi-fw pi-inbox',
                        routerLink: ['/gestion_comm'],
                    },
                    {
                        label: 'Réclamations',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/messagerie-reclamation'],
                    },
                    {
                        label: 'Feedback',
                        icon: 'pi pi-fw pi-comment',
                        routerLink: ['/feedback'],
                    },
                ],
            },
        ];
    }

    private getCoachMenu(): MenuItem[] {
        return [
            {
                label: 'ACCUEIL',
                icon: 'pi pi-fw pi-home',
                items: [
                    {
                        label: 'Tableau de bord',
                        icon: 'pi pi-fw pi-chart-bar',
                        routerLink: ['/coach-dashboard'],
                    },
                ],
            },
            {
                label: 'CALENDRIER',
                icon: 'pi pi-fw pi-calendar',
                routerLink: ['/rendez-vous-planner-coach'],
            },
            {
                label: 'PROJETS',
                icon: 'pi pi-fw pi-folder',
                items: [
                    {
                        label: 'Mes projets',
                        icon: 'pi pi-fw pi-list',
                        routerLink: ['/GetProjet'],
                    },
                ],
            },
            {
                label: 'PLANIFICATION',
                icon: 'pi pi-fw pi-calendar-plus',
                items: [
                    {
                        label: 'Nouveau',
                        icon: 'pi pi-fw pi-plus',
                        routerLink: ['/rendez-vous-planner-coach'],
                    },
                    {
                        label: 'Documents',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/ShowCoachDoc'],
                    },
                    {
                        label: 'Livrables',
                        icon: 'pi pi-fw pi-file-export',
                        routerLink: ['/coach-entrep-deliverable'],
                    },
                    {
                        label: 'Notes',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/coach-notes-list'],
                    },
                    {
                        label: 'Tâches',
                        icon: 'pi pi-fw pi-tasks',
                        routerLink: ['/projects/:projectId/documents'],
                    },
                ],
            },
            {
                label: 'ADMIN LIVRABLES',
                icon: 'pi pi-fw pi-file',
                items: [
                    {
                        label: 'Livrables',
                        icon: 'pi pi-fw pi-file',
                        routerLink: ['/coach-deliverable'],
                    },
                ],
            },
            {
                label: 'COMMUNICATION',
                icon: 'pi pi-fw pi-comments',
                items: [
                    {
                        label: 'Messagerie',
                        icon: 'pi pi-fw pi-inbox',
                        routerLink: ['/gestion_comm'],
                    },
                    {
                        label: 'Réclamations',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/messagerie-reclamation'],
                    },
                    {
                        label: 'Feedback',
                        icon: 'pi pi-fw pi-comment',
                        routerLink: ['/feedback'],
                    },
                ],
            },
        ];
    }
}
