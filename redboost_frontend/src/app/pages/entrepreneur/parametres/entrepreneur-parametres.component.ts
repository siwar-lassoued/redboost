import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

type ParamTab = 'profil' | 'securite';

@Component({
    selector: 'rb-entrepreneur-parametres',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    template: `
    <div class="max-w-4xl mx-auto p-6 min-h-screen">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-foreground tracking-tight">Paramètres</h1>
        <p class="text-muted-foreground mt-1">Gérez votre profil et la sécurité de votre compte</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-4">
          <div class="bg-card rounded-3xl p-6 text-center shadow-xl border border-border relative overflow-hidden">
            <div class="absolute inset-0 bg-primary/5 pointer-events-none"></div>
            <div class="relative inline-block mb-4">
              <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg"
                style="background: linear-gradient(135deg, #7B2D8B, #4A148C)">
                {{ initials() }}
              </div>
            </div>
            <h3 class="font-bold text-foreground text-base">{{ userName() }}</h3>
            <span class="inline-block mt-3 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest text-white shadow-md"
              style="background: linear-gradient(135deg, #7B2D8B, #4A148C)">ENTREPRENEUR</span>
          </div>

          <nav class="bg-card rounded-2xl overflow-hidden shadow-lg border border-border">
            @for (tab of tabs; track tab.id) {
              <button (click)="activeTab.set(tab.id)" 
                [class]="activeTab() === tab.id ? 'bg-primary/5 text-primary border-primary' : 'text-muted-foreground hover:bg-muted border-transparent'"
                class="w-full flex items-center gap-3 px-6 py-4 text-sm font-bold transition-all border-l-4 cursor-pointer">
                <lucide-icon [name]="tab.icon" [size]="18"></lucide-icon>
                {{ tab.label }}
              </button>
            }
          </nav>
        </div>

        <!-- Main -->
        <div class="lg:col-span-3">
          <div class="bg-card rounded-3xl p-8 shadow-xl border border-border min-h-[500px]">
            @if (activeTab() === 'profil') {
              <h2 class="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                <lucide-icon name="user" [size]="20" class="text-primary"></lucide-icon>
                Mon Profil
              </h2>
              <div class="grid grid-cols-2 gap-6 mb-6">
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nom complet</label>
                  <input [(ngModel)]="form.name" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Téléphone</label>
                  <input [(ngModel)]="form.phone" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">LinkedIn</label>
                  <input [(ngModel)]="form.linkedinUrl" placeholder="https://linkedin.com/in/..." class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Secteur</label>
                  <input [(ngModel)]="form.secteur" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
                <div class="col-span-2 space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Description du projet</label>
                  <textarea [(ngModel)]="form.descriptionProjet" rows="3" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-foreground"></textarea>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Stade du projet</label>
                  <select [(ngModel)]="form.stadeProjet" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm text-foreground appearance-none cursor-pointer">
                    <option value="IDEE">Idée</option>
                    <option value="MVP">MVP</option>
                    <option value="CROISSANCE">Croissance</option>
                    <option value="SCALE">Scale</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Besoins coaching</label>
                  <input [(ngModel)]="form.besoinsCoaching" placeholder="Levée de fonds, stratégie..." class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
              </div>
            }

            @if (activeTab() === 'securite') {
              <h2 class="text-xl font-black text-foreground mb-6 flex items-center gap-2">
                <lucide-icon name="shield" [size]="20" class="text-primary"></lucide-icon>
                Sécurité
              </h2>
              <div class="space-y-6">
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                  <input type="password" placeholder="••••••••" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Confirmer</label>
                  <input type="password" placeholder="••••••••" class="w-full bg-background border border-border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground">
                </div>
              </div>
            }

            <div class="flex items-center gap-3 mt-10 pt-6 border-t border-border">
              <button (click)="handleSave()"
                class="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] border-none cursor-pointer"
                style="background: var(--rb-gradient-primary)">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`:host { display: block; }`]
})
export class EntrepreneurParametresComponent implements OnInit {
  private authSvc = inject(AuthService);
  private userSvc = inject(UserService);

  activeTab = signal<ParamTab>('profil');
  tabs: { id: ParamTab; icon: string; label: string }[] = [
    { id: 'profil', icon: 'user', label: 'Mon Profil' },
    { id: 'securite', icon: 'shield', label: 'Sécurité' },
  ];

  form = { name: '', phone: '', linkedinUrl: '', secteur: '', descriptionProjet: '', stadeProjet: 'MVP', besoinsCoaching: '' };
  userName = signal('');
  initials = signal('');

  ngOnInit() {
    const user = this.authSvc.currentUser$.value;
    if (user) {
      this.form.name = `${user.prenom ?? ''} ${user.nom ?? ''}`.trim();
      this.form.phone = user.telephone || '';
      this.form.linkedinUrl = (user as any).linkedinUrl || '';
      this.userName.set(this.form.name);
      this.initials.set(`${(user.prenom || '')[0] ?? ''}${(user.nom || '')[0] ?? ''}`);
    }
  }

  handleSave() {
    const user = this.authSvc.currentUser$.value;
    if (!user) return;
    const parts = this.form.name.trim().split(' ');
    this.userSvc.update(user.id, {
      prenom: parts[0] || '',
      nom: parts.slice(1).join(' ') || '',
      telephone: this.form.phone
    }).subscribe(() => alert('Sauvegardé !'));
  }
}
