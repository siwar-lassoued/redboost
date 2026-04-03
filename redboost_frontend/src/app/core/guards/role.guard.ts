import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (roles: UserRole[]): CanActivateFn => () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return roles.some(r => auth.hasRole(r)) || router.createUrlTree(['/auth/login']);
};
