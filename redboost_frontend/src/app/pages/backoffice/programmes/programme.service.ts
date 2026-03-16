import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import {
    Programme,
    Secteur,
    Sprint,
    Activite,
    Tache,
    DocumentDTO,
} from '../../../models/programme';
import { map, Observable, tap } from 'rxjs';

export interface UserResponsable {
    id: number;
    fullName: string;
    email: string;
    role: string;
}
export interface UserEntrepreneur {
    id: number;
    fullName: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

export interface KpiWithStatus {
    id: number;
    nom: string;
    description?: string;
    uniteMesure: string;
    objectif: string;
    category: {
        id: number;
        nom: string;
        type: 'GLOBAL' | 'OPTIONNEL';
        couleur?: string;
    };
    isGlobal: boolean;
    isAttached: boolean;
    cannotRemove: boolean;
}

export interface BackofficeKpi {
    id: number;
    nom: string;
    description?: string;
    uniteMesure: string;
    objectif?: string;
    category: {
        id: number;
        nom: string;
        type: string;
        couleur?: string;
    };
}

export interface ActivityKpi {
    id: number;
    nom: string;
    description?: string;
    uniteMesure: string;
    objectif?: string;
    type?: string;
    categoryId?: number;
    categoryNom: string;
    categoryCouleur?: string;
}

// === DTOs pour sprints détaillés ===
export interface TacheDetail {
    id: number;
    titre: string;
    description?: string;
    priorite: string;
    status: string;
    responsableId?: number;
    difficulte?: string;
    dateDebut?: string;
    dateLimite?: string;
    kpis?: BackofficeKpi[];
}

export interface ActiviteDetail {
    id: number;
    nom: string;
    description?: string;
    dateDebut?: string;
    dateFin?: string;
    responsableId?: number;
    status: string;
    retardJours: number;
    progression: number;
    nombreTaches: number;
    taches: TacheDetail[];
    kpis?: BackofficeKpi[];
    expanded?: boolean;
}

export interface SprintDetailGlobal {
    id: number;
    nom: string;
    description?: string;
    dateDebut: string;
    dateFin: string;
    status: string;
    retardJours: number;
    progression: number;
    nombreActivites: number;
    programmeId: number;
    activites: ActiviteDetail[];
    documents?: DocumentDTO[];
    programmeNom?: string;
}
export interface SprintDetail {
    id: number;
    nom: string;
    description?: string;
    dateDebut: string;
    dateFin: string;
    status: string;
    retardJours: number;
    progression: number;
    nombreActivites: number;
    activites: ActiviteDetail[];
    expanded?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProgrammeService {
    private api = 'https://redboost.tn/api/backoffice/programmes';
    private apikpi = 'https://redboost.tn/api/programmeskpi';
    private userApi = 'https://redboost.tn/api/users';

    programmes = signal<Programme[]>([]);
    responsables = signal<UserResponsable[]>([]);
    secteurs = signal<Secteur[]>([]);

    constructor(private http: HttpClient) {
        this.loadAll();
        this.loadResponsables();
        this.loadSecteurs();
    }

    getProgrammeById(id: number) {
        return this.http
            .get<any>(`${this.api}/${id}`)
            .pipe(tap((data: any) => console.log('Programme chargé:', data)));
    }

    loadAll() {
        this.http
            .get<Programme[]>(this.api)
            .subscribe((data) => this.programmes.set(data));
    }

    loadResponsables() {
        this.http.get<any[]>(`${this.userApi}/admins`).subscribe({
            next: (data) => {
                const mapped = data.map((u) => ({
                    id: u.id,
                    fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                    email: u.email,
                    role: u.role,
                }));
                console.log(
                    'Responsables chargés avec fullName reconstruit:',
                    mapped,
                );
                this.responsables.set(mapped);
            },
            error: (err) => {
                console.error('Erreur chargement responsables', err);
            },
        });
    }

    loadSecteurs() {
        console.log('Loading secteurs from backend...');
        this.http.get<Secteur[]>(`${this.api}/secteurs`).subscribe({
            next: (data) => {
                console.log('Secteurs loaded:', data);
                this.secteurs.set(
                    data.sort((a, b) => a.nom.localeCompare(b.nom)),
                );
            },
            error: (err) => {
                console.error('Failed to load secteurs!', err);
                this.secteurs.set([]);
            },
        });
    }

    create(p: Programme) {
        return this.http.post<Programme>(this.api, p);
    }

    update(id: number, p: Programme) {
        return this.http.put<Programme>(`${this.api}/${id}`, p);
    }

    delete(id: number) {
        return this.http.delete(`${this.api}/${id}`);
    }

    uploadLogo(id: number, file: File) {
        const form = new FormData();
        form.append('file', file);
        return this.http.post<{ logoUrl: string }>(
            `${this.api}/${id}/logo`,
            form,
        );
    }

    // KPI endpoints
    getKpisDetail(programmeId: number) {
        return this.http.get<Record<string, KpiWithStatus[]>>(
            `${this.api}/${programmeId}/kpis-detail`,
        );
    }

    // Get all OPTIONNEL KPIs for a programme (for activity modal)
    getOptionnelKpis(programmeId: number) {
        return this.http.get<BackofficeKpi[]>(
            `${this.api}/${programmeId}/kpis/optionnels`,
        );
    }

    // Get KPIs for a specific activity (for task modal)
    // Change return type
    getActivityKpis(activityId: number) {
        return this.http.get<ActivityKpi[]>(
            `${this.api}/activities/${activityId}/kpis`,
        );
    }

    addKpi(programmeId: number, kpiId: number) {
        return this.http.post(`${this.api}/${programmeId}/kpis/${kpiId}`, null);
    }

    removeKpi(programmeId: number, kpiId: number) {
        return this.http.delete(`${this.api}/${programmeId}/kpis/${kpiId}`);
    }

    // SPRINT METHODS
    getSprints(programmeId: number) {
        return this.http.get<Sprint[]>(`${this.api}/${programmeId}/sprints`);
    }

    createSprint(programmeId: number, sprint: Sprint) {
        return this.http.post<Sprint>(
            `${this.api}/${programmeId}/sprints`,
            sprint,
        );
    }

    updateSprint(sprintId: number, sprint: Sprint) {
        return this.http.put<Sprint>(`${this.api}/sprints/${sprintId}`, sprint);
    }

    deleteSprint(sprintId: number) {
        return this.http.delete(`${this.api}/sprints/${sprintId}`);
    }

    // ACTIVITY METHODS - Updated to accept KPI IDs
    createActivity(
        programmeId: number,
        sprintId: number,
        activite: Activite,
        kpiIds?: number[],
    ) {
        const payload = { activite, kpiIds: kpiIds || [] };
        return this.http.post<Activite>(
            `${this.api}/${programmeId}/sprints/${sprintId}/activities`,
            payload,
        );
    }

    updateActivity(activityId: number, activite: Activite, kpiIds?: number[]) {
        const payload = { activite, kpiIds: kpiIds || [] };
        return this.http.put<Activite>(
            `${this.api}/activities/${activityId}`,
            payload,
        );
    }

    deleteActivity(activityId: number) {
        return this.http.delete(`${this.api}/activities/${activityId}`);
    }

    // TASK METHODS - Updated to accept KPI IDs
    getTaches(activiteId: number) {
        return this.http.get<Tache[]>(
            `${this.api}/activities/${activiteId}/taches`,
        );
    }

    createTache(
        programmeId: number,
        sprintId: number,
        activiteId: number,
        tache: Tache,
        kpiIds?: number[],
    ) {
        const payload = { tache, kpiIds: kpiIds || [] };
        return this.http.post<Tache>(
            `${this.api}/${programmeId}/sprints/${sprintId}/activities/${activiteId}/taches`,
            payload,
        );
    }

    updateTache(tacheId: number, tache: Tache, kpiIds?: number[]) {
        const payload = { tache, kpiIds: kpiIds || [] };
        return this.http.put<Tache>(`${this.api}/taches/${tacheId}`, payload);
    }

    deleteTache(tacheId: number) {
        return this.http.delete(`${this.api}/taches/${tacheId}`);
    }

    getSprintsWithDetails(programmeId: number) {
        return this.http.get<SprintDetail[]>(
            `${this.api}/${programmeId}/sprints-detail`,
        );
    }

    // SPRINT DOCUMENT METHODS
    uploadSprintDocuments(
        sprintId: number,
        files: File[],
        uploadedById?: number,
    ) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        if (uploadedById) {
            formData.append('uploadedById', uploadedById.toString());
        }
        return this.http.post<DocumentDTO[]>(
            `${this.api}/sprints/${sprintId}/documents`,
            formData,
        );
    }

    getSprintDocuments(sprintId: number) {
        return this.http.get<DocumentDTO[]>(
            `${this.api}/sprints/${sprintId}/documents`,
        );
    }

    deleteSprintDocument(documentId: number) {
        return this.http.delete(`${this.api}/sprint-documents/${documentId}`);
    }


    reorderSprints(sprintIds: number[]): Observable<void> {
    return this.http.put<void>(`https://redboost.tn/api/v1/sprints/reorder`, sprintIds);
}
    // Add to ProgrammeService class

    // ACTIVITY DOCUMENT METHODS
    uploadActivityDocuments(
        activityId: number,
        files: File[],
        uploadedById?: number,
    ) {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        if (uploadedById) {
            formData.append('uploadedById', uploadedById.toString());
        }
        return this.http.post<DocumentDTO[]>(
            `${this.api}/activities/${activityId}/documents`,
            formData,
        );
    }

    getActivityDocuments(activityId: number) {
        return this.http.get<DocumentDTO[]>(
            `${this.api}/activities/${activityId}/documents`,
        );
    }

    deleteActivityDocument(documentId: number) {
        return this.http.delete(`${this.api}/activity-documents/${documentId}`);
    }

    // In your programme.service.ts, update the getAllSprints method:

    getAllSprints() {
        return this.http
            .get<SprintDetailGlobal[]>(`${this.api}/sprints-detail-global`)
            .pipe(
                tap((data) => {
                    console.log('✅ API Response:', data);

                    console.log('Response type:', typeof data);

                    console.log('Is array?', Array.isArray(data));

                    console.log('Length:', data?.length);
                }),
            );
    }

    // Add these methods to your ProgrammeService

    // Get all programmes for dropdown

    getAllProgrammesBasic(): Observable<Programme[]> {
        return this.http.get<Programme[]>(`${this.api}/all-programmes`);
    }

    // Create sprint with programme ID

    createSprintForProgramme(
        programmeId: number,
        sprint: Sprint,
    ): Observable<Sprint> {
        return this.http.post<Sprint>(
            `${this.api}/${programmeId}/sprints`,

            sprint,
        );
    }

    // Add these methods to ProgrammeService

    // TACHE DOCUMENT METHODS

    uploadTacheDocuments(
        tacheId: number,
        files: File[],
        uploadedById?: number,
    ) {
        const formData = new FormData();

        files.forEach((file) => formData.append('files', file));

        if (uploadedById) {
            formData.append('uploadedById', uploadedById.toString());
        }

        return this.http.post<DocumentDTO[]>(
            `${this.api}/taches/${tacheId}/documents`,
            formData,
        );
    }

    getTacheDocuments(tacheId: number) {
        return this.http.get<DocumentDTO[]>(
            `${this.api}/taches/${tacheId}/documents`,
        );
    }

    deleteTacheDocument(documentId: number) {
        return this.http.delete(`${this.api}/tache-documents/${documentId}`);
    }

    getProgrammeKpiValues(programmeId: number) {
        return this.http.get<any[]>(`${this.apikpi}/${programmeId}/kpis`);
    }

    updateProgrammeKpiValue(data: any) {
        return this.http.post<any>(
            `${this.apikpi}/${data.programmeId}/kpis`,
            data,
        );
    }

    createActivityInSprint(
        sprintId: number,
        activite: Activite,
        kpiIds: number[] = [],
    ) {
        const payload = { activite, kpiIds };
        return this.http.post<Activite>(
            `${this.api}/sprints/${sprintId}/activities`,
            payload,
        );
    }

    // Add this method to your programme.service.ts

    deleteEntrepreneurKpiValue(
        programmeId: number,
        kpiId: number,
        userId: number,
    ): Observable<void> {
        return this.http.delete<void>(
            `${this.apikpi}/${programmeId}/kpis/${kpiId}/entrepreneur-values/${userId}`,
        );
    }

   // In your programme.service.ts file, replace the updateKpiValuesForEntrepreneur method with this:

updateKpiValuesForEntrepreneur(
    programmeId: number,
    kpiId: number,
    userId: number,
    payload: any, // Changed from 'valeur: string' to 'payload: any'
): Observable<void> {
    const requestPayload = {
        ...payload, // Spread the payload to include all fields (valeur OR valeurPrecedente/Actuelle/Cible)
    };

    console.log('🚀 Sending entrepreneur KPI value:', requestPayload);

    return this.http.put<void>(
        `${this.apikpi}/${programmeId}/kpis/${kpiId}/entrepreneur-values`,
        requestPayload,
    );
}

    getRetardItems(): Observable<any> {
        return this.http.get<any>(`${this.api}/retard-items`);
    }

    getAllEntrepreneurs(): Observable<UserEntrepreneur[]> {
        return this.http.get<any[]>(`${this.userApi}/entrepreneurs`).pipe(
            tap((data) => console.log('📥 Raw entrepreneurs from API:', data)),
            map((entrepreneurs) =>
                entrepreneurs.map((e) => ({
                    id: e.id,
                    fullName: `${e.firstName || ''} ${e.lastName || ''}`.trim(),
                    email: e.email,
                    role: e.role,
                    firstName: e.firstName,
                    lastName: e.lastName,
                })),
            ),
            tap((transformed) =>
                console.log('✅ Transformed entrepreneurs:', transformed),
            ),
        );
    }

    // Add this method to your ProgrammeService (programme.service.ts)

// Get KPI History
getKpiHistory(programmeId: number, kpiId: number): Observable<any[]> {
    return this.http.get<any[]>(
        `${this.apikpi}/${programmeId}/kpis/${kpiId}/history`
    );
}

// Get Entrepreneur Value History (for future use)
getEntrepreneurValueHistory(
    programmeId: number,
    kpiId: number,
    userId: number
): Observable<any[]> {
    return this.http.get<any[]>(
        `${this.apikpi}/${programmeId}/kpis/${kpiId}/entrepreneurs/${userId}/history`
    );
}
getGlobalStatistics(): Observable<any> {
  return this.http.get<any>(
    `${this.api}/statistics/global`
  );
}
// Activity KPI Values
getActivitiesKpiValues(programmeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${programmeId}/activities-kpis`);
}

updateActiviteKpiValeur(
    activityId: number,
    kpiId: number,
    payload: { valeur: string | null }
): Observable<void> {
    return this.http.put<void>(
        `${this.api}/activities/${activityId}/kpis/${kpiId}/valeur`,
        payload
    );
}

deleteActiviteKpiValeur(activityId: number, kpiId: number): Observable<void> {
    return this.http.delete<void>(
        `${this.api}/activities/${activityId}/kpis/${kpiId}/valeur`
    );
}

// Task KPI Values
getTachesKpiValues(programmeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${programmeId}/taches-kpis`);
}

updateTacheKpiValeur(
    tacheId: number,
    kpiId: number,
    payload: { valeur: string | null }
): Observable<void> {
    return this.http.put<void>(
        `${this.api}/taches/${tacheId}/kpis/${kpiId}/valeur`,
        payload
    );
}

deleteTacheKpiValeur(tacheId: number, kpiId: number): Observable<void> {
    return this.http.delete<void>(
        `${this.api}/taches/${tacheId}/kpis/${kpiId}/valeur`
    );
}
}
