import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Landing } from './app/pages/frontoffice/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';

import { SigninComponent } from './app/pages/frontoffice/gestion_user/auth/signin/signin.component';
import { SignUpComponent } from './app/pages/frontoffice/gestion_user/auth/signup/signup.component';
import { ConfirmEmailComponent } from './app/pages/frontoffice/gestion_user/auth/confirm-email/confirm-email.component';

import { UserProfileComponent } from './app/pages/frontoffice/gestion_user/profile/profile.component';
import { ContactLandingComponent } from './app/pages/frontoffice/landing/components/contact-landing';
import { MarketLandingComponent } from './app/pages/frontoffice/landing/components/market-landing';
import { CoachRequestComponent } from './app/pages/backoffice/become_coach/coachrequest';
import { AllCoachRequestsComponent } from './app/pages/backoffice/become_coach/all-coach-requests.component';
import { RoleGuard } from './role.guard';
import { DashboardRedirectComponent } from './app/pages/dashboard/dashboard-redirect/dashboard-redirect.component';
import { UnderConstructionComponent } from './app/pages/under-construction.component';

import { ForgotPasswordComponent } from './app/pages/frontoffice/gestion_user/forgotpassword/forgotpassword.component';
import { ResetPasswordComponent } from './app/pages/frontoffice/gestion_user/reset-password/reset-password.component';

import { UserListComponent } from './app/pages/backoffice/allUsers/user-list.component';
import { BinomeCoachRequestComponent } from './app/pages/backoffice/become_coach/binome_coach_request';

import { ServiceslandingComponent } from './app/pages/servicePage/services.component';

import { Component } from '@angular/core';
import { PrivacyPolicyComponent } from './app/pages/frontoffice/Verification/privacy-policy/privacy';
import { CategoryListComponent } from './app/pages/backoffice/gestion_Cat_Kpi/category-list.component';
import { ProgrammeListComponent } from './app/pages/backoffice/programmes/programme_list.component';
import { LastProgrammeKpiListComponent } from './app/pages/backoffice/programmes/gestion_program/main_getsion_program/prog-kpi-list.component';
import { MesTachesActivitesComponent } from './app/pages/backoffice/programmes/Gestion_sprint/mes_tache_activite/mes_taches_activites';
import { DashboardProgramComponent } from './app/pages/backoffice/programmes/gestion_program/program_Dashboard/dashboard-program';
//import { SprintDashboardComponent } from './app/pages/backoffice/programmes/Gestion_sprint/SprintDashboard/sprintdashboard';
import { RapportRedactionComponent } from './app/pages/backoffice/programmes/gestion_program/workflow/rapport.component';
import { EntrepreneursManagementComponent } from './app/pages/backoffice/programmes/gestion_entrepreneur/entrepreneur';
import { SubmitCandidatureComponent } from './app/pages/backoffice/candidature_redstarter/submit_candidature/submit_candidature';
import { AdminCandidaturesComponent } from './app/pages/backoffice/candidature_redstarter/admin_candidature/admin_candidature';
import { AdminHistoriqueComponent } from './app/pages/backoffice/candidature_redstarter/admin_historique/admin_historique';
import { AdminMatchingComponent } from './app/pages/backoffice/candidature_redstarter/admin_matching/admin_matching';
import { AdminReportingIaComponent } from './app/pages/backoffice/candidature_redstarter/admin_reporting_ia/admin-reporting-ia.component';
import { TemplateListComponent } from './app/pages/backoffice/database_management/template/suivitemplate';
import { InsertDataComponent } from './app/pages/backoffice/database_management/insertion_data/template_list/insertion_donnees';
import { TemplateDataManagementComponent } from './app/pages/backoffice/database_management/insertion_data/data_view/data_management';
import { DataFilterComponent } from './app/pages/backoffice/database_management/data_filter/data_filter';
import { CalendarComponent } from './app/pages/backoffice/event_organizer/calendar/event_calendar';
import { DashboardGlobalComponent } from './app/pages/backoffice/dashboard_global/dashboard_global';
import { DashboardViewComponent } from './app/pages/backoffice/programmes/Gestion_sprint/SprintDashboard/dashoard/dashboard-overview';

import { AdminPlanningComponent } from './app/pages/backoffice/admin-planning/admin-planning.component';

import { CoachDashboardComponent } from './app/pages/dashboard/coachDashboard/CoachDashboard';
import { DisponibilitesComponent } from './app/pages/dashboard/coachDashboard/disponibilites.component';
import { ReclamationsComponent } from './app/pages/dashboard/coachDashboard/reclamations.component';
import { CoachEntrepreneursComponent } from './app/pages/dashboard/coachDashboard/coach-entrepreneurs.component';
import { CoachEntrepreneurDetailComponent } from './app/pages/dashboard/coachDashboard/coach-entrepreneur-detail.component';
import { SessionsComponent } from './app/pages/dashboard/coachDashboard/sessions.component';
import { CoachChatComponent } from './app/pages/dashboard/coachDashboard/coach-chat.component';
import { CoachRapportMissionsComponent } from './app/pages/dashboard/coachDashboard/coach-rapport-missions.component';
import { CoachRapportSessionComponent } from './app/pages/dashboard/coachDashboard/coach-rapport-session.component';
import { CoachLivrablesComponent } from './app/pages/dashboard/coachDashboard/coach-livrables.component';
import { NoteDeSyntheseCreateComponent } from './app/pages/dashboard/coachDashboard/note-de-synthese-create.component';
import { SeanceExceptionnelleComponent } from './app/pages/dashboard/coachDashboard/seance-exceptionnelle.component';

// New dynamic KPI and Form features
import { AdminKpiFormsComponent } from './app/pages/backoffice/kpi_forms/admin-kpi-forms.component';
import { AdminEvaluationsComponent } from './app/pages/backoffice/evaluations/admin-evaluations.component';
import { AdminLivrablesComponent } from './app/pages/backoffice/livrables/admin-livrables.component';
import { AdminReclamationsComponent } from './app/pages/backoffice/reclamations/admin-reclamations.component';
import { AdminSupervisionDashboardComponent } from './app/pages/backoffice/admin-supervision/admin-supervision.component';
import { EntrepreneurKpiFormsComponent } from './app/pages/entrepreneur/kpi_forms/entrepreneur-kpi-forms.component';
import { EntrepreneurDashboardComponent } from './app/pages/entrepreneur/dashboard/entrepreneur-dashboard.component';
import { MesCoachsComponent } from './app/pages/entrepreneur/mes-coachs/mes-coachs.component';
import { EntrepreneurSessionsComponent } from './app/pages/entrepreneur/mes-sessions/entrepreneur-sessions.component';
import { CoachRatingComponent } from './app/pages/entrepreneur/coach-rating/coach-rating.component';
import { EntrepreneurTachesComponent } from './app/pages/entrepreneur/mes-taches/entrepreneur-taches.component';
import { EntrepreneurLivrablesComponent } from './app/pages/entrepreneur/mes-livrables/entrepreneur-livrables.component';
import { EntrepreneurProgrammeComponent } from './app/pages/entrepreneur/mon-programme/entrepreneur-programme.component';
import { EntrepreneurChatComponent } from './app/pages/entrepreneur/chat/entrepreneur-chat.component';
import { EntrepreneurParametresComponent } from './app/pages/entrepreneur/parametres/entrepreneur-parametres.component';

import { CoachPlanningComponent } from './app/pages/dashboard/coachDashboard/coach-planning.component';
import { EntrepreneurReclamationsComponent } from './app/pages/dashboard/entrepredashboard/reclamations/reclamations.component';
export const pagesRoutes: Routes = [
    { path: 'profile', component: UserProfileComponent },
    { path: 'all-users', component: UserListComponent },
];

export const appRoutes: Routes = [
    { path: '', component: Landing },
    { path: 'privacy', component: PrivacyPolicyComponent },
    { path: 'redstarter', component: SubmitCandidatureComponent },
    { path: 'coach-request', component: CoachRequestComponent },
    { path: 'signin', component: SigninComponent },
    { path: 'signup', component: SignUpComponent },
    { path: 'contactlanding', component: ContactLandingComponent },
    { path: 'forgot-password', component: ForgotPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'confirm-email', component: ConfirmEmailComponent },
    { path: 'binome-coach-request', component: BinomeCoachRequestComponent },
    { path: 'marketlanding', component: MarketLandingComponent },
    { path: 'serviceslanding', component: ServiceslandingComponent },
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                canActivate: [RoleGuard],
                component: DashboardRedirectComponent,
            },

            {
                path: 'investor-dashboard',
                canActivate: [RoleGuard],
                data: { expectedRole: 'INVESTOR' },
                component: UnderConstructionComponent,
            },
        {path:'dashbsprint',component:DashboardViewComponent },
            { path: 'underconstruction', component: UnderConstructionComponent},
            {path:'dashboardglobal',component:DashboardGlobalComponent},
            {path:'calendar',component:CalendarComponent},
            { path: 'data_filter', component: DataFilterComponent },
            {  path: 'template-data-management/:id',component: TemplateDataManagementComponent },
            { path: 'insertdata', component: InsertDataComponent },
            { path: 'suivitemplate', component: TemplateListComponent },
            { path: 'admin_redstarter', component: AdminCandidaturesComponent },
            { path: 'admin_historique', component: AdminHistoriqueComponent },
            { path: 'admin_matching', component: AdminMatchingComponent },
            { path: 'admin_reporting_ia', component: AdminReportingIaComponent },
            { path: 'admin_planning', component: AdminPlanningComponent },
            {path: 'gestion-entrepreneur',component: EntrepreneursManagementComponent},
            { path: 'workflow', component: RapportRedactionComponent },
           // { path: 'sprintdash', component: SprintDashboardComponent },
            { path: 'mes-taches', component: MesTachesActivitesComponent },
            {
                path: 'programme/:id/program-dashboard',
                component: DashboardProgramComponent,
            },
            { path: 'programme/:id', component: LastProgrammeKpiListComponent },
            { path: 'programme', component: ProgrammeListComponent },

            { path: 'backoffice_cat_kpi', component: CategoryListComponent },
            { path: 'profile', component: UserProfileComponent },
            {
                path: 'all-coach-requests',
                component: AllCoachRequestsComponent,
            },
            { path: 'coach-dashboard', component: CoachDashboardComponent },
            { path: 'disponibilites', component: DisponibilitesComponent },
            { path: 'mes-disponibilites', component: DisponibilitesComponent },
            { path: 'coach-entrepreneurs', component: CoachEntrepreneursComponent },
            { path: 'coach-entrepreneurs/:id', component: CoachEntrepreneurDetailComponent },
            { path: 'mes-sessions', component: SessionsComponent },
            { path: 'coach-chat', component: CoachChatComponent },
            { path: 'gestion_comm', component: EntrepreneurChatComponent },
            { path: 'rapport-missions', component: CoachRapportMissionsComponent },
            { path: 'rapport-sessions', component: CoachRapportSessionComponent },
            { path: 'coach-planning', component: CoachPlanningComponent },
            { path: 'coach-entrep-deliverable', component: CoachLivrablesComponent },
            { path: 'coach-livrables', component: CoachLivrablesComponent },
            { path: 'note-de-synthese-create/:id', component: NoteDeSyntheseCreateComponent },
            { path: 'messagerie-reclamation', component: ReclamationsComponent },
            { path: 'coach-reclamations', component: ReclamationsComponent },
            { path: 'seance-exceptionnelle', component: SeanceExceptionnelleComponent },

            // New KPI and Form features
            { path: 'admin-kpi-forms', component: AdminKpiFormsComponent },
            { path: 'admin-evaluations', component: AdminEvaluationsComponent },
            { path: 'admin-livrables', component: AdminLivrablesComponent },
            { path: 'admin-reclamations', component: AdminReclamationsComponent },
            { path: 'admin-supervision', component: AdminSupervisionDashboardComponent },
            
            // Entrepreneur Profile
            { path: 'entrep-calendar', component: EntrepreneurSessionsComponent },
            { path: 'mes-sessions-entrep', component: EntrepreneurSessionsComponent },
            { path: 'entrep-deliverable', component: EntrepreneurLivrablesComponent },
            { path: 'entrepreneur-kpi-forms', component: EntrepreneurKpiFormsComponent },
            { path: 'feedback', component: CoachRatingComponent },
            
            // Entrepreneur Routes
            { path: 'entrepreneur-dashboard', component: EntrepreneurDashboardComponent },
            { path: 'entrepreneur/mes-coachs', component: MesCoachsComponent },
            { path: 'entrepreneur/mes-sessions', component: EntrepreneurSessionsComponent },
            { path: 'entrepreneur/mes-taches', component: EntrepreneurTachesComponent },
            { path: 'entrepreneur/mes-livrables', component: EntrepreneurLivrablesComponent },
            { path: 'entrepreneur/mon-programme', component: EntrepreneurProgrammeComponent },
            { path: 'entrepreneur/chat', component: EntrepreneurChatComponent },
            { path: 'entrepreneur/parametres', component: EntrepreneurParametresComponent },
            { path: 'entrepreneur/reclamations', component: EntrepreneurReclamationsComponent },
            { path: 'coach-rating/:sessionId', component: CoachRatingComponent },

            ...pagesRoutes,
        ],
    },
    { path: '', component: Landing },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: 'notfound' },
];
