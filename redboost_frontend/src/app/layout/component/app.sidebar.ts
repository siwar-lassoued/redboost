import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMenu } from './app.menu';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, AppMenu],
    template: `
        <div class="layout-sidebar">
            <app-menu></app-menu>
        </div>
    `,
    styles: [
        `
            .layout-sidebar {
                position: fixed;
                left: 0;
                top: 80px;
                width: 280px;
                height: calc(100vh - 80px);
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-right: 1px solid rgba(0, 0, 0, 0.05);
                box-shadow: var(--premium-shadow-sm);
                overflow-y: auto;
                overflow-x: hidden;
                z-index: 999;
                transition: var(--transition-smooth);
                scrollbar-width: none;
            }

            .layout-sidebar::-webkit-scrollbar {
                display: none;
            }

            /* Menu Styles */
            :host ::ng-deep .layout-menu {
                padding: 0.5rem 0;
                list-style: none;
                margin: 0;
            }

            :host ::ng-deep .layout-menu > li {
                margin: 0;
            }

            :host ::ng-deep .layout-menu > li.menu-separator {
                height: 1px;
                background-color: #f0f0f0;
                margin: 0.5rem 0;
            }

            /* Parent Menu Items */
            :host ::ng-deep .layout-menu > li > a,
            :host ::ng-deep .layout-menu > li > .menu-item-link {
                display: flex;
                align-items: center;
                padding: 0.85rem 1.25rem;
                margin: 0.25rem 1rem;
                color: #64748b;
                text-decoration: none;
                font-size: 0.95rem;
                font-weight: 500;
                border-radius: 12px;
                transition: var(--transition-smooth);
                cursor: pointer;
                position: relative;
                user-select: none;
            }

            :host ::ng-deep .layout-menu > li > a i,
            :host ::ng-deep .layout-menu > li > .menu-item-link i {
                font-size: 1.25rem;
                margin-right: 0.75rem;
                width: 24px;
                text-align: center;
                color: #94a3b8;
                transition: var(--transition-smooth);
            }

            /* Hover State */
            :host ::ng-deep .layout-menu > li > a:hover,
            :host ::ng-deep .layout-menu > li > .menu-item-link:hover {
                background-color: rgba(0, 0, 0, 0.02);
                color: #1e293b;
                transform: translateX(4px);
            }

            :host ::ng-deep .layout-menu > li > a:hover i,
            :host ::ng-deep .layout-menu > li > .menu-item-link:hover i {
                color: #1e293b;
            }

            /* Active Menu Item */
            :host ::ng-deep .layout-menu > li > a.active-route,
            :host ::ng-deep .layout-menu > li > .menu-item-link.active-route {
                background: var(--sidebar-active-bg);
                color: var(--sidebar-active-color);
                font-weight: 700;
                box-shadow: var(--premium-shadow-sm);
            }

            :host ::ng-deep .layout-menu > li > a.active-route i,
            :host ::ng-deep .layout-menu > li > .menu-item-link.active-route i {
                color: var(--sidebar-active-color);
                transform: scale(1.1);
            }

            /* Decorative indicator for active route */
            :host ::ng-deep .layout-menu > li > a.active-route::before,
            :host ::ng-deep .layout-menu > li > .menu-item-link.active-route::before {
                content: '';
                position: absolute;
                left: -1rem;
                top: 50%;
                transform: translateY(-50%);
                width: 4px;
                height: 24px;
                background: var(--sidebar-active-color);
                border-radius: 0 4px 4px 0;
            }

            /* Section Label */
            :host ::ng-deep .menu-section-label {
                font-size: 0.75rem;
                font-weight: 700;
                color: #94a3b8;
                padding: 1.5rem 1.5rem 0.5rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            :host ::ng-deep .menu-item-text {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            /* Submenu Container */
            :host ::ng-deep .layout-menu ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }

            :host ::ng-deep .layout-menu ul.root-submenu {
                background: transparent;
            }

            /* Submenu Items */
            :host ::ng-deep .layout-menu > li > ul > li {
                margin: 0;
            }

            :host ::ng-deep .layout-menu > li > ul > li > a {
                display: flex;
                align-items: center;
                padding: 0.65rem 1.5rem 0.65rem 3.25rem;
                color: #6c757d;
                text-decoration: none;
                font-size: 0.9rem;
                font-weight: 400;
                transition: all 0.2s ease;
                position: relative;
            }

            :host ::ng-deep .layout-menu > li > ul > li > a::before {
                content: '';
                position: absolute;
                left: 2.5rem;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background-color: #cbd5e0;
                transition: all 0.2s ease;
            }

            :host ::ng-deep .layout-menu > li > ul > li > a i {
                font-size: 0.9rem;
                margin-right: 0.65rem;
                color: #6c757d;
                transition: color 0.2s ease;
            }

            /* Submenu Hover */
            :host ::ng-deep .layout-menu > li > ul > li > a:hover {
                background-color: #f0f0f0;
                color: #495057;
                padding-left: 3.35rem;
            }

            :host ::ng-deep .layout-menu > li > ul > li > a:hover::before {
                background-color: #e91e63;
                transform: scale(1.3);
            }

            :host ::ng-deep .layout-menu > li > ul > li > a:hover i {
                color: #495057;
            }

            /* Submenu Active */
            :host ::ng-deep .layout-menu > li > ul > li > a.active-route {
                background-color: rgba(233, 30, 99, 0.08);
                color: #e91e63;
                font-weight: 500;
                padding-left: 3.35rem;
            }

            :host
                ::ng-deep
                .layout-menu
                > li
                > ul
                > li
                > a.active-route::before {
                background-color: #e91e63;
                width: 6px;
                height: 6px;
            }

            :host ::ng-deep .layout-menu > li > ul > li > a.active-route i {
                color: #e91e63;
            }

            /* Mobile Responsive */
            @media (max-width: 991px) {
                .layout-sidebar {
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                }

                :host-context(.layout-mobile-active) .layout-sidebar {
                    transform: translateX(0);
                }
            }
        `,
    ],
})
export class AppSidebar {}
