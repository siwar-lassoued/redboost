import { Injectable } from '@angular/core';
import {
    CanActivate,
    Router,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './app/pages/frontoffice/service/auth.service';

@Injectable({
    providedIn: 'root',
})
export class RoleGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router,
    ) {}

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
    ): boolean {
        const expectedRole = route.data['expectedRole'];
        const userRole = this.authService.getUserRole();

        if (!expectedRole) {
            return true;
        }

        if (userRole === expectedRole) {
            return true;
        } else {
            this.router.navigate(['/notfound']);
            return false;
        }
    }
}
