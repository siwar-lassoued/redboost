import { Component, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppFooter } from './app.footer';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../core/services/auth.service';
import { inject } from '@angular/core';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter],
    template: `
        <div class="layout-wrapper" [ngClass]="containerClass">
            <app-topbar></app-topbar>
            <app-sidebar></app-sidebar>

            <div class="layout-main-container">
                <div class="layout-main">
                    <router-outlet></router-outlet>
                </div>
                <app-footer></app-footer>
            </div>
            <div class="layout-mask animate-fadein" (click)="hideMenu()"></div>
        </div>
    `,
    styles: [
        `
            .layout-wrapper {
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                background-color: #f8f9fa;
            }

            .layout-main-container {
                margin-top: 80px;
                margin-left: 300px;
                flex: 1;
                display: flex;
                flex-direction: column;
                transition: var(--transition-smooth);
                min-height: calc(100vh - 80px);
            }

            .layout-main {
                flex: 1;
                padding: 2rem;
                background-color: #f8f9fa;
            }

            .layout-mask {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.4);
                z-index: 998;
            }

            .layout-wrapper.layout-mobile-active .layout-mask {
                display: block;
            }

            @media (max-width: 991px) {
                .layout-main-container {
                    margin-left: 0 !important;
                }
            }

            @media (max-width: 768px) {
                .layout-main {
                    padding: 1.5rem !important;
                }
            }

            @media (max-width: 480px) {
                .layout-main {
                    padding: 1rem !important;
                }
            }

            .animate-fadein {
                animation: fadeIn 0.2s;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `,
    ],
})
export class AppLayout {
    overlayMenuOpenSubscription: Subscription;
    menuOutsideClickListener: any;

    @ViewChild(AppSidebar) appSidebar!: AppSidebar;
    @ViewChild(AppTopbar) appTopBar!: AppTopbar;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router,
        private authService: AuthService
    ) {
        this.overlayMenuOpenSubscription =
            this.layoutService.overlayOpen$.subscribe(() => {
                if (!this.menuOutsideClickListener) {
                    this.menuOutsideClickListener = this.renderer.listen(
                        'document',
                        'click',
                        (event) => {
                            if (this.isOutsideClicked(event)) {
                                this.hideMenu();
                            }
                        },
                    );
                }

                if (this.layoutService.layoutState().staticMenuMobileActive) {
                    this.blockBodyScroll();
                }
            });

        this.router.events
            .pipe(filter((event) => event instanceof NavigationEnd))
            .subscribe(() => {
                this.hideMenu();
            });
    }

    isOutsideClicked(event: MouseEvent) {
        const sidebarEl = document.querySelector('.layout-sidebar');
        const topbarEl = document.querySelector('.layout-menu-button');
        const eventTarget = event.target as Node;

        return !(
            sidebarEl?.isSameNode(eventTarget) ||
            sidebarEl?.contains(eventTarget) ||
            topbarEl?.isSameNode(eventTarget) ||
            topbarEl?.contains(eventTarget)
        );
    }

    hideMenu() {
        this.layoutService.layoutState.update((prev) => ({
            ...prev,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false,
        }));

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(
                new RegExp(
                    '(^|\\b)' +
                        'blocked-scroll'.split(' ').join('|') +
                        '(\\b|$)',
                    'gi',
                ),
                ' ',
            );
        }
    }

    get containerClass() {
        return {
            'layout-overlay':
                this.layoutService.layoutConfig().menuMode === 'overlay',
            'layout-static':
                this.layoutService.layoutConfig().menuMode === 'static',
            'layout-static-inactive':
                this.layoutService.layoutState().staticMenuDesktopInactive &&
                this.layoutService.layoutConfig().menuMode === 'static',
            'layout-overlay-active':
                this.layoutService.layoutState().overlayMenuActive,
            'layout-mobile-active':
                this.layoutService.layoutState().staticMenuMobileActive,
            ['role-' + (this.authService.getRole()?.toLowerCase() || 'admin')]: true
        };
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
