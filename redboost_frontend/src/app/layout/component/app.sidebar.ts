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
                top: 70px;
                width: 280px;
                height: calc(100vh - 70px);
                background-color: #ffffff;
                box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
                overflow-y: auto;
                overflow-x: hidden;
                z-index: 999;
                scrollbar-width: thin;
                scrollbar-color: #e0e0e0 transparent;
            }

            .layout-sidebar::-webkit-scrollbar {
                width: 6px;
            }

            .layout-sidebar::-webkit-scrollbar-track {
                background: transparent;
            }

            .layout-sidebar::-webkit-scrollbar-thumb {
                background: #e0e0e0;
                border-radius: 3px;
            }

            .layout-sidebar::-webkit-scrollbar-thumb:hover {
                background: #bdbdbd;
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
                padding: 0.75rem 1.5rem;
                color: #6c757d;
                text-decoration: none;
                font-size: 1rem;
                font-weight: 560;
                transition: all 0.2s ease;
                cursor: pointer;
                position: relative;
                user-select: none;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }

            :host ::ng-deep .layout-menu > li > a i,
            :host ::ng-deep .layout-menu > li > .menu-item-link i {
                font-size: 1.1rem;
                margin-right: 0.75rem;
                width: 20px;
                text-align: center;
                color: #6c757d;
                transition: color 0.2s ease;
            }

            :host ::ng-deep .layout-menu > li > a .menu-toggle-icon,
            :host
                ::ng-deep
                .layout-menu
                > li
                > .menu-item-link
                .menu-toggle-icon {
                margin-left: auto;
                font-size: 0.7rem;
                transition: transform 0.2s ease;
            }

            /* Hover State */
            :host ::ng-deep .layout-menu > li > a:hover,
            :host ::ng-deep .layout-menu > li > .menu-item-link:hover {
                background-color: #f8f9fa;
                color: #495057;
            }

            :host ::ng-deep .layout-menu > li > a:hover i,
            :host ::ng-deep .layout-menu > li > .menu-item-link:hover i {
                color: #495057;
            }

            /* Active Menu Item */
            :host ::ng-deep .layout-menu > li > a.active-route,
            :host ::ng-deep .layout-menu > li > .menu-item-link.active-route {
                background-color: rgba(233, 30, 99, 0.08);
                color: #e91e63;
                font-weight: 600;
            }

            :host ::ng-deep .layout-menu > li > a.active-route i,
            :host ::ng-deep .layout-menu > li > .menu-item-link.active-route i {
                color: #e91e63;
            }

            /* Active Menuitem with Children */
            :host ::ng-deep .layout-menu > li > a.active-menuitem,
            :host
                ::ng-deep
                .layout-menu
                > li
                > .menu-item-link.active-menuitem {
                color: #212529;
            }

            :host ::ng-deep .layout-menu > li > a.active-menuitem i:first-child,
            :host
                ::ng-deep
                .layout-menu
                > li
                > .menu-item-link.active-menuitem
                i:first-child {
                color: #e91e63;
            }

            :host
                ::ng-deep
                .layout-menu
                > li
                > a.active-menuitem
                .menu-toggle-icon,
            :host
                ::ng-deep
                .layout-menu
                > li
                > .menu-item-link.active-menuitem
                .menu-toggle-icon {
                transform: rotate(90deg);
            }

            /* Submenu Container */
            :host ::ng-deep .layout-menu > li > ul {
                list-style: none;
                padding: 0;
                margin: 0;
                overflow: hidden;
                background-color: #fafafa;
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
