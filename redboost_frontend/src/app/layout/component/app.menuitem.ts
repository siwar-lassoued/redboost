import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import {
    trigger,
    state,
    style,
    transition,
    animate,
} from '@angular/animations';

@Component({
    selector: '[app-menuitem]',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <ng-container *ngIf="!item.separator">
            <!-- Parent menu item with routerLink and no children -->
            <a
                *ngIf="item.routerLink && !item.items"
                [routerLink]="item.routerLink"
                [routerLinkActive]="'active-route'"
                [routerLinkActiveOptions]="{ exact: false }"
                class="menu-item-link"
            >
                <i [class]="item.icon"></i>
                <span class="menu-item-text">{{ item.label }}</span>
                <span *ngIf="item.badge" [class]="item.badgeStyleClass">{{ item.badge }}</span>
            </a>

            <!-- Root Section Label (if root and has items) -->
            <div *ngIf="root && item.items" class="menu-section-label">
                {{ item.label }}
            </div>

            <!-- Parent menu item without routerLink or with children (non-root or root without items) -->
            <a
                *ngIf="(!item.routerLink || item.items) && (!root || !item.items)"
                (click)="toggleSubmenu($event)"
                class="menu-item-link"
                [class.active-menuitem]="isActive"
            >
                <i [class]="item.icon"></i>
                <span class="menu-item-text">{{ item.label }}</span>
                <i
                    *ngIf="item.items"
                    class="pi pi-angle-right menu-toggle-icon"
                ></i>
            </a>

            <!-- Submenu (now items for root, or actual submenu for non-root) -->
            <ul
                *ngIf="item.items && (isActive || root)"
                [@submenuAnimation]="isActive || root ? 'visible' : 'hidden'"
                [class.root-submenu]="root"
            >
                <li *ngFor="let subitem of item.items">
                    <!-- Standard Menu Item (subitem) -->
                    <a
                        *ngIf="subitem.routerLink"
                        [routerLink]="subitem.routerLink"
                        [routerLinkActive]="'active-route'"
                        [routerLinkActiveOptions]="{ exact: false }"
                        class="menu-item-link"
                    >
                        <i [class]="subitem.icon" *ngIf="subitem.icon"></i>
                        <span class="menu-item-text">{{ subitem.label }}</span>
                        <span *ngIf="subitem.badge" [class]="subitem.badgeStyleClass">{{ subitem.badge }}</span>
                    </a>
                </li>
            </ul>
        </ng-container>
    `,
    animations: [
        trigger('submenuAnimation', [
            state(
                'hidden',
                style({
                    height: '0',
                    opacity: '0',
                    overflow: 'hidden',
                }),
            ),
            state(
                'visible',
                style({
                    height: '*',
                    opacity: '1',
                }),
            ),
            transition('hidden => visible', animate('300ms ease-in-out')),
            transition('visible => hidden', animate('300ms ease-in-out')),
        ]),
    ],
})
export class AppMenuitem implements OnInit, OnDestroy {
    @Input() item!: MenuItem;
    @Input() index!: number;
    @Input() root: boolean = false;

    isActive: boolean = false;
    private routerSubscription: Subscription | undefined;

    constructor(private router: Router) {}

    ngOnInit() {
        // Subscribe to router events to track active state
        this.routerSubscription = this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                this.updateActiveState();
            });

        // Initial check
        this.updateActiveState();
    }

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    toggleSubmenu(event: Event) {
        event.preventDefault();
        if (this.item.items) {
            this.isActive = !this.isActive;
        }
    }

    private updateActiveState() {
        if (this.item.items && this.item.items.length > 0) {
            // Check if any child route is active
            this.isActive = this.item.items.some((child) => {
                if (child.routerLink) {
                    const routerLink = Array.isArray(child.routerLink)
                        ? child.routerLink[0]
                        : child.routerLink;
                    return this.router.isActive(routerLink, false);
                }
                return false;
            });
        }
    }
}
