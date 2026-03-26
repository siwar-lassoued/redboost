import {
    Component,
    OnInit,
    HostListener,
    OnDestroy,
    Inject,
    PLATFORM_ID,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
    trigger,
    state,
    style,
    transition,
    animate,
    keyframes,
} from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { StyleClassModule } from 'primeng/styleclass';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { SkeletonModule } from 'primeng/skeleton';
import { TieredMenuModule } from 'primeng/tieredmenu';

import { AuthService } from '../../service/auth.service';
import { UserService } from '../../service/UserService';

import { User } from '../../../../models/user';


@Component({
    selector: 'topbar-widget',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        StyleClassModule,
        ButtonModule,
        RippleModule,
        BadgeModule,
        AvatarModule,
        TooltipModule,
        MenuModule,
        SkeletonModule,
        TieredMenuModule,
    ],
    animations: [
        // ... (keep all your existing animations)
        trigger('topBarAnimation', [
            transition(':enter', [
                style({ transform: 'translateY(-100%)', opacity: 0 }),
                animate(
                    '0.5s cubic-bezier(0.33, 1, 0.68, 1)',
                    style({ transform: 'translateY(0)', opacity: 1 }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '0.3s cubic-bezier(0.33, 1, 0.68, 1)',
                    style({ transform: 'translateY(-100%)', opacity: 0 }),
                ),
            ]),
        ]),
        trigger('buttonAnimation', [
            state(
                'default',
                style({
                    transform: 'scale(1)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                }),
            ),
            state(
                'hovered',
                style({
                    transform: 'scale(1.03)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
                }),
            ),
            transition(
                'default <=> hovered',
                animate('0.3s cubic-bezier(0.4, 0, 0.2, 1)'),
            ),
        ]),
        trigger('menuAnimation', [
            state(
                'closed',
                style({
                    opacity: 0,
                    height: 0,
                    transform: 'translateY(-20px)',
                }),
            ),
            state(
                'open',
                style({
                    opacity: 1,
                    height: '*',
                    transform: 'translateY(0)',
                }),
            ),
            transition(
                'closed <=> open',
                animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)'),
            ),
        ]),
        trigger('navItemAnimation', [
            transition(':enter', [
                animate(
                    '0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    keyframes([
                        style({
                            opacity: 0,
                            transform: 'translateY(-15px)',
                            offset: 0,
                        }),
                        style({
                            opacity: 0.5,
                            transform: 'translateY(-5px)',
                            offset: 0.3,
                        }),
                        style({
                            opacity: 1,
                            transform: 'translateY(0)',
                            offset: 1,
                        }),
                    ]),
                ),
            ]),
        ]),
        trigger('profileAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.85)' }),
                animate(
                    '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    style({ opacity: 1, transform: 'scale(1)' }),
                ),
            ]),
        ]),
        trigger('pulseAnimation', [
            state('default', style({ transform: 'scale(1)' })),
            state('pulse', style({ transform: 'scale(1.05)' })),
            transition('default <=> pulse', animate('0.5s ease-in-out')),
        ]),
    ],
    template: `
        <div class="top-bar-wrapper" @topBarAnimation>
            <!-- Top Contact and Social Media Section -->
            <div class="top-contact-bar" [class.hidden]="isScrolled">
                <div class="top-contact-container">
                    <div class="contact-info">
                        <span class="contact-item">
                            <i class="pi pi-info-circle"></i> RedBoost Beta
                            Version
                        </span>
                        <span class="contact-item">
                            <i class="pi pi-phone"></i>+216 71 793 125
                        </span>
                        <span class="contact-item">
                            <i class="pi pi-envelope"></i>hello&#64;redstart.tn
                        </span>
                    </div>
                    <div class="social-media">
                        <a href="#" class="social-icon" aria-label="Facebook">
                            <i class="pi pi-facebook"></i>
                        </a>
                        <a href="#" class="social-icon" aria-label="Instagram">
                            <i class="pi pi-instagram"></i>
                        </a>
                        <a href="#" class="social-icon" aria-label="LinkedIn">
                            <i class="pi pi-linkedin"></i>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Main Navigation Bar -->
            <div class="main-navbar" [class.scrolled]="isScrolled">
                <div class="nav-container">
                    <!-- Logo -->
                    <a
                        class="logo-container"
                        routerLink="/"
                        aria-label="RedBoost Home"
                        [@pulseAnimation]="logoState"
                        (mouseenter)="logoState = 'pulse'"
                        (mouseleave)="logoState = 'default'"
                    >
                        <img
                            src="assets/images/logo_redboost.png"
                            alt="RedBoost Logo"
                            class="logo"
                        />
                    </a>

                    <!-- Desktop Navigation Links -->
                    <nav class="desktop-nav">
                        <ul class="nav-list">
                            <li
                                *ngFor="let item of menuItems; let i = index"
                                [@navItemAnimation]="i * 100"
                            >
                                <ng-container
                                    *ngIf="item.subItems; else singleLink"
                                >
                                    <p-tieredMenu
                                        [model]="item.subItems"
                                        [popup]="true"
                                        #menu
                                        (click)="toggleSubMenu(menu, $event)"
                                    >
                                        <ng-template
                                            pTemplate="item"
                                            let-subItem
                                        >
                                            <a
                                                class="nav-link sub-menu-link"
                                                [routerLink]="subItem.route"
                                                [class.active]="
                                                    isActiveRoute(subItem.route)
                                                "
                                            >
                                                <i
                                                    class="pi"
                                                    [class]="subItem.icon"
                                                ></i>
                                                <div class="sub-menu-content">
                                                    <span class="link-text">{{
                                                        subItem.label
                                                    }}</span>
                                                    <span
                                                        class="sub-menu-description"
                                                        >{{
                                                            subItem.description
                                                        }}</span
                                                    >
                                                </div>
                                            </a>
                                        </ng-template>
                                    </p-tieredMenu>
                                    <a
                                        class="nav-link"
                                        (click)="toggleSubMenu(menu, $event)"
                                    >
                                        <span class="link-text">{{
                                            item.label
                                        }}</span>
                                        <i
                                            class="pi pi-angle-down sub-menu-arrow"
                                        ></i>
                                        <span class="link-underline"></span>
                                    </a>
                                </ng-container>
                                <ng-template #singleLink>
                                    <a
                                        (click)="navigateTo(item.route)"
                                        class="nav-link"
                                        [class.active]="
                                            item.route
                                                ? isActiveRoute(item.route)
                                                : false
                                        "
                                        role="menuitem"
                                    >
                                        <span class="link-text">{{
                                            item.label
                                        }}</span>
                                        <span class="link-underline"></span>
                                    </a>
                                </ng-template>
                            </li>
                        </ul>
                    </nav>

                    <!-- User Actions -->
                    <div class="user-actions">
                        <ng-container
                            *ngIf="!isLoggedIn; else loggedInTemplate"
                        >
                            <button
                                pButton
                                pRipple
                                label="Se connecter"
                                routerLink="signin"
                                [rounded]="true"
                                class="register-btn"
                                [@buttonAnimation]="registerBtnStateDesktop"
                                (mouseenter)="
                                    registerBtnStateDesktop = 'hovered'
                                "
                                (mouseleave)="
                                    registerBtnStateDesktop = 'default'
                                "
                                aria-label="Register"
                            ></button>
                        </ng-container>

                        <ng-template #loggedInTemplate>
                            <div class="user-profile" @profileAnimation>
                                <div
                                    class="profile-container"
                                    #profileContainer
                                >
                                    <a
                                        class="profile-link"
                                        aria-label="User Profile"
                                        (click)="toggleProfileMenu()"
                                    >
                                        <div class="profile-avatar">
                                            <ng-container
                                                *ngIf="user; else userSkeleton"
                                            >
                                                <!-- FIXED: Use getImageUrl() method -->
                                                <p-avatar 
    *ngIf="user.profilePictureUrl" 
    [image]="getImageUrl(user.profilePictureUrl)" 
    shape="circle" 
   >
</p-avatar>

<p-avatar 
    *ngIf="!user.profilePictureUrl" 
    icon="pi pi-user" 
    shape="circle" 
   
    styleClass="avatar-placeholder">
</p-avatar>
                                               <!--  <span
                                                    class="notification-badge"
                                                    pBadge
                                                    [value]="notificationCount"
                                                    severity="danger"
                                                ></span> -->
                                            </ng-container>
                                            <ng-template #userSkeleton>
                                                <p-skeleton
                                                    shape="circle"
                                                    size="3rem"
                                                    class="mr-2"
                                                ></p-skeleton>
                                            </ng-template>
                                        </div>
                                        <span class="user-name" *ngIf="user"
                                            >{{ user.firstName }}
                                            {{ user.lastName }}</span
                                        >
                                        <i
                                            class="pi pi-angle-down profile-arrow"
                                            [class.rotated]="isProfileMenuOpen"
                                        ></i>
                                    </a>
                                </div>

                                <!-- Profile Dropdown Menu -->
                                <div
                                    class="profile-menu"
                                    [class.active]="isProfileMenuOpen"
                                    [@menuAnimation]="
                                        isProfileMenuOpen ? 'open' : 'closed'
                                    "
                                >
                                    <ul class="profile-menu-list">
                                        <li>
                                            <a
                                                routerLink="/profile"
                                                class="profile-menu-item"
                                            >
                                                <i class="pi pi-user"></i>
                                                <span>Profile</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                routerLink="/settings"
                                                class="profile-menu-item"
                                            >
                                                <i class="pi pi-cog"></i>
                                                <span>Settings</span>
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                routerLink="/notifications"
                                                class="profile-menu-item"
                                            >
                                                <i class="pi pi-bell"></i>
                                                <span>Notifications</span>
                                                <span
                                                    class="notification-count"
                                                    *ngIf="
                                                        notificationCount > 0
                                                    "
                                                    >{{
                                                        notificationCount
                                                    }}</span
                                                >
                                            </a>
                                        </li>
                                        <li class="menu-divider"></li>
                                        <li>
                                            <a
                                                (click)="logout()"
                                                class="profile-menu-item logout"
                                            >
                                                <i class="pi pi-sign-out"></i>
                                                <span>Déconnexion</span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </ng-template>

                        <!-- Mobile Menu Toggle -->
                        <button
                            class="mobile-toggle"
                            (click)="toggleMenu()"
                            aria-label="Toggle navigation menu"
                            [@buttonAnimation]="mobileBtnState"
                            (mouseenter)="mobileBtnState = 'hovered'"
                            (mouseleave)="mobileBtnState = 'default'"
                        >
                            <span class="hamburger-box">
                                <span
                                    class="hamburger-inner"
                                    [class.active]="isMenuOpen"
                                ></span>
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Mobile Menu -->
                <div
                    class="mobile-menu"
                    [@menuAnimation]="isMenuOpen ? 'open' : 'closed'"
                >
                    <ul class="mobile-nav-list">
                        <ng-container
                            *ngFor="let item of menuItems; let i = index"
                            [@navItemAnimation]="i * 100"
                        >
                            <li *ngIf="item.subItems">
                                <a
                                    class="mobile-nav-link"
                                    (click)="toggleMobileSubMenu(item)"
                                >
                                    <i
                                        class="pi"
                                        [class]="getMenuItemIcon(item.label)"
                                    ></i>
                                    {{ item.label }}
                                    <i
                                        class="pi pi-angle-down"
                                        [class.rotated]="item.showSubMenu"
                                    ></i>
                                </a>
                                <ul
                                    class="mobile-sub-menu"
                                    *ngIf="item.showSubMenu"
                                >
                                    <li *ngFor="let subItem of item.subItems">
                                        <a
                                            [routerLink]="subItem.route"
                                            class="mobile-nav-link mobile-sub-nav-link"
                                            [class.active]="
                                                isActiveRoute(subItem.route)
                                            "
                                        >
                                            <i
                                                class="pi"
                                                [class]="subItem.icon"
                                            ></i>
                                            {{ subItem.label }} -
                                            {{ subItem.description }}
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <li *ngIf="!item.subItems">
                                <a
                                    (click)="navigateTo(item.route)"
                                    class="mobile-nav-link"
                                    [class.active]="
                                        item.route
                                            ? isActiveRoute(item.route)
                                            : false
                                    "
                                    role="menuitem"
                                >
                                    <i
                                        class="pi"
                                        [class]="getMenuItemIcon(item.label)"
                                    ></i>
                                    {{ item.label }}
                                </a>
                            </li>
                        </ng-container>
                        <ng-container *ngIf="!isLoggedIn">
                            <li>
                                <a
                                    routerLink="/signin"
                                    class="mobile-nav-link mobile-auth-link"
                                >
                                    <i class="pi pi-sign-in"></i>
                                    Se connecter
                                </a>
                            </li>
                            <li>
                                <a
                                    routerLink="/signup"
                                    class="mobile-nav-link mobile-auth-link register"
                                >
                                    <i class="pi pi-user-plus"></i>
                                    S'inscrire
                                </a>
                            </li>
                        </ng-container>
                        <ng-container *ngIf="isLoggedIn">
                            <li>
                                <a
                                    routerLink="/profile"
                                    class="mobile-nav-link"
                                >
                                    <i class="pi pi-user"></i>
                                    Profile
                                </a>
                            </li>
                            <li>
                                <a (click)="logout()" class="mobile-nav-link">
                                    <i class="pi pi-sign-out"></i>
                                    Déconnexion
                                </a>
                            </li>
                        </ng-container>
                    </ul>
                </div>
            </div>
        </div>
    `,
    styles: [
        // ... (keep all your existing styles)
        `
            :host {
                display: block;
                position: sticky;
                top: 0;
                z-index: 1000;
                font-family:
                    'Inter',
                    -apple-system,
                    BlinkMacSystemFont,
                    'Segoe UI',
                    Roboto,
                    sans-serif;
                --primary-color: #c8223a;
                --primary-light: #e84c62;
                --secondary-color: #034a55;
                --secondary-light: #056b7d;
                --text-color: #1e293b;
                --text-light: #64748b;
                --bg-light: rgba(255, 255, 255, 0.98);
                --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
                --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
                --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.15);
                --border-radius: 16px;
                --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .top-bar-wrapper {
                width: 100%;
            }

            /* Top Contact Bar with Gradient */
            .top-contact-bar {
                background: linear-gradient(
                    90deg,
                    var(--secondary-color),
                    var(--primary-color)
                );
                color: white;
                padding: 0.75rem 0;
                border-bottom-left-radius: var(--border-radius);
                border-bottom-right-radius: var(--border-radius);
                transition:
                    transform 0.5s cubic-bezier(0.33, 1, 0.68, 1),
                    opacity 0.5s;
                overflow: hidden;
            }

            .top-contact-bar.hidden {
                transform: translateY(-100%);
                opacity: 0;
            }

            .top-contact-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1280px;
                margin: 0 auto;
                padding: 0 2rem;
            }

            .contact-info,
            .social-media {
                display: flex;
                align-items: center;
                gap: 1.75rem;
            }

            .contact-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                font-weight: 400;
                transition: var(--transition);
            }

            .contact-item:hover {
                transform: translateY(-2px);
                opacity: 0.9;
            }

            .social-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.15);
                color: white;
                text-decoration: none;
                transition: var(--transition);
            }

            .social-icon:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: translateY(-3px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            }

            /* Main Navigation with Glassmorphism and Radius */
            .main-navbar {
                background: var(--bg-light);
                backdrop-filter: blur(12px);
                border-bottom-left-radius: var(--border-radius);
                border-bottom-right-radius: var(--border-radius);
                padding: 1rem 0;
                box-shadow: var(--shadow-md);
                transition: var(--transition);
            }

            .main-navbar.scrolled {
                box-shadow: var(--shadow-lg);
                background: rgba(255, 255, 255, 0.98);
            }

            .nav-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1280px;
                margin: 0 auto;
                padding: 0 2rem;
            }

            /* Logo */
            .logo-container {
                display: flex;
                align-items: center;
                text-decoration: none;
                color: var(--text-color);
                transition: var(--transition);
            }

            .logo-container:hover {
                transform: scale(1.05);
            }

            .logo {
                height: 48px;
                margin-right: 1rem;
                transition: var(--transition);
            }

            /* Desktop Navigation */
            .desktop-nav {
                display: flex;
                align-items: center;
            }

            .nav-list {
                display: flex;
                list-style: none;
                margin: 0;
                padding: 0;
                gap: 2.75rem;
            }

            .nav-link {
                position: relative;
                display: flex;
                align-items: center;
                text-decoration: none;
                color: var(--text-color);
                font-weight: 500;
                font-size: 1.05rem;
                padding: 0.75rem 0;
                transition: var(--transition);
                cursor: pointer;
                gap: 0.5rem;
            }

            .sub-menu-arrow {
                font-size: 0.9rem;
                transition: var(--transition);
            }

            .nav-link:hover,
            .nav-link.active {
                color: var(--primary-color);
            }

            .sub-menu-link {
                display: flex;
                align-items: flex-start;
                padding: 0.75rem 1rem;
                width: 250px;
                background: var(--bg-light);
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                margin: 0.25rem 0;
                transition: var(--transition);
            }

            .sub-menu-link:hover {
                background: rgba(0, 0, 0, 0.05);
                transform: translateX(5px);
            }

            .sub-menu-content {
                flex-grow: 1;
                margin-left: 0.75rem;
            }

            .link-text {
                display: block;
                font-weight: 600;
                color: var(--text-color);
            }

            .sub-menu-description {
                display: block;
                font-size: 0.75rem;
                color: var(--text-light);
                margin-top: 0.25rem;
            }

            .link-underline {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 0;
                height: 3px;
                background: linear-gradient(
                    90deg,
                    var(--primary-color),
                    var(--secondary-color)
                );
                transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 3px;
            }

            .nav-link:hover .link-underline,
            .nav-link.active .link-underline {
                width: 100%;
            }

            /* User Actions */
            .user-actions {
                display: flex;
                align-items: center;
                gap: 1.25rem;
            }

            .login-btn.p-button {
                background: transparent;
                color: var(--secondary-color);
                border: 2px solid var(--secondary-color);
                border-radius: 50px;
                font-weight: 600;
                padding: 0.75rem 1.75rem;
                transition: var(--transition);
                font-size: 0.95rem;
            }

            .login-btn.p-button:hover {
                background: var(--secondary-color);
                color: white;
                transform: translateY(-3px);
                box-shadow: var(--shadow-md);
            }

            .register-btn.p-button {
                background: linear-gradient(
                    135deg,
                    var(--primary-color),
                    var(--secondary-color)
                );
                color: white;
                border: none;
                border-radius: 50px;
                font-weight: 600;
                padding: 0.75rem 1.75rem;
                transition: var(--transition);
                font-size: 0.95rem;
            }

            .register-btn.p-button:hover {
                box-shadow: 0 8px 25px rgba(200, 34, 58, 0.25);
                transform: translateY(-3px);
            }

            /* User Profile */
            .user-profile {
                display: flex;
                align-items: center;
                position: relative;
            }

            .profile-container {
                position: relative;
            }

            .profile-link {
                display: flex;
                align-items: center;
                text-decoration: none;
                color: var(--text-color);
                gap: 0.75rem;
                transition: var(--transition);
                padding: 0.5rem 1rem;
                border-radius: 50px;
                background: rgba(255, 255, 255, 0.5);
                backdrop-filter: blur(8px);
                cursor: pointer;
            }

            .profile-link:hover {
                background: rgba(255, 255, 255, 0.7);
                transform: translateY(-2px);
                box-shadow: var(--shadow-sm);
            }

            .profile-avatar {
                position: relative;
            }

            .avatar-placeholder {
                background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
            }

            .user-name {
                font-weight: 500;
                color: var(--text-color);
                font-size: 1rem;
            }

            .profile-arrow {
                transition: var(--transition);
                font-size: 0.9rem;
            }

            .profile-arrow.rotated {
                transform: rotate(180deg);
            }

            .notification-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                border: 2px solid white;
                font-size: 0.8rem;
            }

            /* Profile Dropdown Menu */
            .profile-menu {
                position: absolute;
                top: 100%;
                right: 0;
                width: 240px;
                background: var(--bg-light);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-lg);
                margin-top: 0.75rem;
                overflow: hidden;
                z-index: 1000;
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .profile-menu-list {
                list-style: none;
                margin: 0;
                padding: 0.5rem 0;
            }

            .profile-menu-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1.5rem;
                text-decoration: none;
                color: var(--text-color);
                font-weight: 500;
                transition: var(--transition);
                cursor: pointer;
            }

            .profile-menu-item:hover {
                background: rgba(0, 0, 0, 0.05);
                color: var(--primary-color);
            }

            .profile-menu-item.logout {
                color: #ef4444;
            }

            .profile-menu-item.logout:hover {
                background: rgba(239, 68, 68, 0.1);
            }

            .menu-divider {
                height: 1px;
                background: rgba(0, 0, 0, 0.1);
                margin: 0.5rem 0;
            }

            .notification-count {
                margin-left: auto;
                background: var(--primary-color);
                color: white;
                font-size: 0.75rem;
                padding: 0.15rem 0.5rem;
                border-radius: 10px;
            }

            /* Mobile Toggle - Modern Hamburger */
            .mobile-toggle {
                display: none;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.75rem;
                margin-left: 0.75rem;
                border-radius: 50%;
                transition: var(--transition);
            }

            .mobile-toggle:hover {
                background: rgba(0, 0, 0, 0.05);
            }

            .hamburger-box {
                width: 28px;
                height: 28px;
                display: inline-block;
                position: relative;
            }

            .hamburger-inner,
            .hamburger-inner::before,
            .hamburger-inner::after {
                width: 28px;
                height: 3px;
                background-color: var(--text-color);
                border-radius: 4px;
                position: absolute;
                transition: var(--transition);
            }

            .hamburger-inner::before,
            .hamburger-inner::after {
                content: '';
                display: block;
            }

            .hamburger-inner::before {
                top: -9px;
            }

            .hamburger-inner::after {
                bottom: -9px;
            }

            .hamburger-inner.active {
                transform: rotate(45deg);
            }

            .hamburger-inner.active::before {
                top: 0;
                opacity: 0;
            }

            .hamburger-inner.active::after {
                bottom: 0;
                transform: rotate(-90deg);
            }

            /* Mobile Menu */
            .mobile-menu {
                overflow: hidden;
                background: var(--bg-light);
                backdrop-filter: blur(12px);
                box-shadow: var(--shadow-md);
                border-bottom-left-radius: var(--border-radius);
                border-bottom-right-radius: var(--border-radius);
            }

            .mobile-nav-list {
                list-style: none;
                margin: 0;
                padding: 1.5rem 0;
            }

            .mobile-nav-link {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.25rem 2.5rem;
                text-decoration: none;
                color: var(--text-color);
                font-weight: 500;
                font-size: 1.1rem;
                transition: var(--transition);
                border-left: 4px solid transparent;
                cursor: pointer;
            }

            .mobile-nav-link:hover,
            .mobile-nav-link.active {
                background: rgba(255, 255, 255, 0.3);
                color: var(--primary-color);
                border-left-color: var(--primary-color);
                transform: translateX(5px);
            }

            .mobile-sub-menu {
                list-style: none;
                padding: 0.5rem 0 0.5rem 3rem;
                background: rgba(0, 0, 0, 0.05);
            }

            .mobile-sub-nav-link {
                padding: 0.75rem 1.5rem;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }

            .mobile-auth-link {
                margin-top: 1rem;
                text-align: center;
                background: rgba(241, 245, 249, 0.5);
                border-radius: 8px;
                margin: 0.5rem 2rem;
                padding: 1rem;
            }

            .mobile-auth-link.register {
                background: linear-gradient(
                    135deg,
                    var(--primary-color),
                    var(--secondary-color)
                );
                color: white;
            }

            /* Responsive Design */
            @media (max-width: 1024px) {
                .top-contact-container {
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                }

                .nav-container {
                    padding: 1rem 1.5rem;
                }

                .desktop-nav {
                    display: none;
                }

                .mobile-toggle {
                    display: block;
                }

                .user-name {
                    display: none;
                }

                .nav-list {
                    gap: 2rem;
                }
            }

            @media (max-width: 768px) {
                .logo {
                    height: 40px;
                }

                .contact-info {
                    display: none;
                }

                .social-media {
                    justify-content: center;
                    width: 100%;
                    gap: 1rem;
                }

                .user-actions .register-btn {
                    display: none;
                }

                .profile-menu {
                    width: 200px;
                    right: -10px;
                }
            }

            @media (max-width: 480px) {
                .social-label {
                    display: none;
                }

                .nav-container {
                    padding: 0.75rem 1rem;
                }

                .profile-link {
                    padding: 0.5rem;
                }

                .profile-arrow {
                    display: none;
                }
            }

            /* Dark Mode */
            @media (prefers-color-scheme: dark) {
                :host {
                    --text-color: #e2e8f0;
                    --text-light: #94a3b8;
                    --bg-light: rgba(15, 23, 42, 0.9);
                }

                .main-navbar {
                    background: var(--bg-light);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .main-navbar.scrolled {
                    background: rgba(15, 23, 42, 0.95);
                }

                .nav-link {
                    color: var(--text-color);
                }

                .user-name {
                    color: var(--text-color);
                }

                .mobile-menu {
                    background: var(--bg-light);
                }

                .mobile-nav-link {
                    color: var(--text-color);
                }

                .mobile-nav-link:hover,
                .mobile-nav-link.active {
                    background: rgba(255, 255, 255, 0.1);
                }

                .mobile-sub-menu {
                    background: rgba(255, 255, 255, 0.05);
                }

                .avatar-placeholder {
                    background: linear-gradient(135deg, #334155, #475569);
                }

                .profile-link:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .hamburger-inner,
                .hamburger-inner::before,
                .hamburger-inner::after {
                    background-color: var(--text-color);
                }

                .mobile-auth-link {
                    background: rgba(255, 255, 255, 0.1);
                }

                .profile-menu {
                    background: rgba(15, 23, 42, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .profile-menu-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .menu-divider {
                    background: rgba(255, 255, 255, 0.1);
                }
            }

            /* Accessibility Improvements */
            .nav-link:focus,
            .mobile-nav-link:focus,
            .social-icon:focus,
            .profile-link:focus {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }

            .mobile-toggle:focus {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
                background: rgba(0, 0, 0, 0.1);
            }
            ::ng-deep .p-avatar {
             width: 36px !important;  /* Adjust pixels as needed */
             height: 36px !important;
            }

            .avatar-placeholder {
             background-color: #dee2e6; /* Light grey for the empty state */
             color: #6c757d;
            }
        `,
    ],
})
export class TopbarWidget implements OnInit, OnDestroy {
    menuItems: {
        label: string;
        route?: string;
        subItems?: {
            label: string;
            route: string;
            icon: string;
            description: string;
        }[];
        showSubMenu?: boolean;
    }[] = [
        { label: 'Accueil', route: '/landing' },
        { label: 'Découvrir', route: '/about' },
        { label: 'Nos Services', route: '/entrepreneurial' },
        {
            label: 'References',
            subItems: [
                {
                    label: 'Resources',
                    route: '/resources',
                    icon: 'pi pi-book',
                    description: 'Educational materials and guides',
                },
                {
                    label: 'Marketplace',
                    route: '/marketlanding',
                    icon: 'pi pi-shopping-cart',
                    description: 'Explore business opportunities',
                },
            ],
            showSubMenu: false,
        },
        {
            label: 'Contact',
            subItems: [
                {
                    label: 'Contact',
                    route: '/contactlanding',
                    icon: 'pi pi-envelope',
                    description: 'Get in touch with us',
                },
                {
                    label: 'Mentorship Program',
                    route: '/coach-request',
                    icon: 'pi pi-user-edit',
                    description: 'Join our mentorship network',
                },
            ],
            showSubMenu: false,
        },
    ];

    isMenuOpen = false;
    isProfileMenuOpen = false;
    isLoggedIn = false;
    isScrolled = false;
    user: User | null = null;
    notificationCount = 3;
    isLoading = true;

    loginBtnStateDesktop = 'default';
    registerBtnStateDesktop = 'default';
    mobileBtnState = 'default';
    logoState = 'default';

    private destroy$ = new Subject<void>();

    constructor(
        public router: Router,
        private authService: AuthService,
        private userService: UserService,
        @Inject(PLATFORM_ID) private platformId: Object,
    ) {}

    @HostListener('window:scroll')
    onWindowScroll() {
        if (isPlatformBrowser(this.platformId)) {
            const scrollPosition =
                window.pageYOffset || document.documentElement.scrollTop || 0;
            this.isScrolled = scrollPosition > 50;
        }
    }

    @HostListener('document:click', ['$event'])
    onClick(event: Event) {
        if (this.isProfileMenuOpen) {
            const target = event.target as HTMLElement;
            if (!target.closest('.profile-container')) {
                this.isProfileMenuOpen = false;
            }
        }
    }

    ngOnInit() {
        this.userService.user$
            .pipe(takeUntil(this.destroy$))
            .subscribe((user) => {
                this.user = this.mapUser(user);
                this.isLoggedIn = !!user;
                this.isLoading = false;
            });

        if (this.authService.isAuthenticated()) {
            const userId = this.authService.getUserId();
            if (userId !== null) {
                this.userService
                    .getUserById(Number(userId))
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: (userData) => {
                            this.user = this.mapUser(userData);
                            this.isLoggedIn = !!this.user;
                            this.userService.setUser(this.user);
                            this.isLoading = false;
                        },
                        error: (error) => {
                            console.error('Failed to fetch user data:', error);
                            this.isLoggedIn = false;
                            this.user = null;
                            this.isLoading = false;
                        },
                    });
            }
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private mapUser(user: any): User | null {
        if (!user) return null;
        return {
            ...user,
            profilePictureUrl:
                user.profile_pictureurl || user.profilePictureUrl || '',
        };
    }

    /**
     * ADDED: Method to construct the full URL for profile images
     * This ensures the relative /uploads/* paths are converted to full URLs
     */
    getImageUrl(url: string | undefined): string {
        if (!url) return 'assets/default-profile.png';

        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        if (url.startsWith('/uploads')) {
            const baseUrl = 'https://redboost.tn'; // CHANGE THIS to your backend URL
            return `${baseUrl}${url}`;
        }
        const baseUrl = 'https://redboost.tn'; // CHANGE THIS to your backend URL
        return `${baseUrl}/uploads/${url}`;
    }

    isActiveRoute(route: string): boolean {
        return this.router.url === route;
    }

    navigateTo(route: string | undefined) {
        if (route) {
            this.router.navigate([route]).catch((err) => {
                console.error(`Navigation error to ${route}:`, err);
            });
        }
        this.isMenuOpen = false;
        this.isProfileMenuOpen = false;
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        if (this.isMenuOpen) {
            this.isProfileMenuOpen = false;
        }
    }

    toggleProfileMenu() {
        this.isProfileMenuOpen = !this.isProfileMenuOpen;
        if (this.isProfileMenuOpen) {
            this.isMenuOpen = false;
        }
    }

    toggleSubMenu(menu: any, event: Event) {
        menu.toggle(event);
    }

    toggleMobileSubMenu(item: any) {
        item.showSubMenu = !item.showSubMenu;
    }

    logout() {
        this.authService.logout();
        this.isLoggedIn = false;
        this.user = null;
        this.isProfileMenuOpen = false;
        this.router.navigate(['/']);
    }

    getMenuItemIcon(label: string): string {
        const iconMap: { [key: string]: string } = {
            'À propos': 'pi-info-circle',
            'Nos Services': 'pi-briefcase',
            References: 'pi-folder-open',
            Contact: 'pi-envelope',
            'Mentorship Program': 'pi-users',
        };

        return iconMap[label] || 'pi-circle';
    }
}