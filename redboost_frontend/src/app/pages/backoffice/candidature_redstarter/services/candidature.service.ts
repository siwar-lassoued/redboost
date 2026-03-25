import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Candidature, CandidatureStatus } from '../models/candidature.model';
import { environment } from '../../../../../environment';

export interface CandidatureFilters {
    programme?: string;
    statut?: CandidatureStatus;
    type?: 'coaches' | 'entrepreneurs' | 'spontanees';
    search?: string;
    page?: number;
    limit?: number;
}

export interface CandidatureLog {
    id: number;
    candidatureId: string;
    action: string;
    statutAvant: string | null;
    statutApres: string;
    faitPar: string | null;
    faitParNom: string;
    note: string | null;
    createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CandidatureService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/candidatures`;

    getAll(filters?: CandidatureFilters): Observable<{ data: Candidature[] }> {
        let params = new HttpParams();
        if (filters?.programme) params = params.set('programme', filters.programme);
        if (filters?.statut) params = params.set('statut', filters.statut);
        if (filters?.type) params = params.set('type', filters.type);
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());

        return this.http.get<any>(`${this.baseUrl}/admin/all`, { params: { ...params.keys().reduce((acc: any, key) => ({ ...acc, [key]: params.get(key) }), {}), size: '1000' } }).pipe(
            map(res => {
                let items: any[] = res.content || res.data || (Array.isArray(res) ? res : []);
                let filtered = items;

                if (filters?.type) {
                    if (filters.type === 'spontanees') {
                        filtered = filtered.filter((c: any) => c.origineCandidature === 'SPONTANEE');
                    } else {
                        const backendType = filters.type === 'coaches' ? 'COACH' : 'ENTREPRENEUR';
                        filtered = filtered.filter((c: any) => c.type === backendType && c.origineCandidature !== 'SPONTANEE');
                    }
                }
                if (filters?.statut) {
                    filtered = filtered.filter((c: any) => c.statut === filters.statut);
                }

                const mappedData: Candidature[] = filtered.map((c: any) => ({
                    id: c.id,
                    type: c.origineCandidature === 'SPONTANEE' ? 'spontanees' : (c.type === 'COACH' ? 'coaches' : 'entrepreneurs'),
                    nom: c.candidat ? `${c.candidat.nom || ''} ${c.candidat.prenom || ''}`.trim() : 'Inconnu',
                    email: c.candidat?.email || 'N/A',
                    phone: c.candidat?.telephone || '—',
                    statut: c.statut,
                    submittedAt: c.dateSoumission || null,
                    programme: c.programme?.nom || null,
                    round: '—',
                    history: [],
                    documents: c.cvUrl ? [{ name: 'CV.pdf', size: '2 MB' }] : [],
                    formAnswers: [],
                    noteInterne: c.noteInterne || null,
                    motifRejet: c.motifRejet || null,
                    dateEntretien: c.dateEntretien || null,
                    compteRenduEntretien: c.compteRenduEntretien || null,
                    noteEntretien: c.noteEntretien || null,
                    dateAcceptation: c.dateAcceptation || null,
                    cvUrl: c.cvUrl || null,
                    lettreUrl: c.lettreUrl || null,
                }));

                if (filters?.search) {
                    const s = filters.search.toLowerCase();
                    return {
                        data: mappedData.filter(c =>
                            c.nom.toLowerCase().includes(s) ||
                            c.email.toLowerCase().includes(s)
                        )
                    };
                }
                return { data: mappedData };
            })
        );
    }

    getById(id: string): Observable<Candidature> {
        return this.http.get<Candidature>(`${this.baseUrl}/admin/${id}`);
    }

    create(data: Partial<Candidature>): Observable<Candidature> {
        return this.http.post<Candidature>(this.baseUrl, data);
    }

    updateStatut(id: string, body: {
        statut: CandidatureStatus;
        noteInterne?: string;
        motifRejet?: string;
        dateEntretien?: string;
        compteRenduEntretien?: string;
        noteEntretien?: number;
    }): Observable<Candidature> {
        let backendStatut: string = String(body.statut).toUpperCase();
        if (backendStatut === 'REJETE') backendStatut = 'REFUSE';
        if (backendStatut === 'EN_REVISION') backendStatut = 'EN_COURS_EVALUATION';

        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, {
            statut: backendStatut,
            commentaires: body.noteInterne || body.motifRejet || ''
        });
    }

    accept(id: string): Observable<Candidature> {
        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, { statut: 'ACCEPTE', commentaires: '' });
    }

    reject(id: string, note?: string): Observable<Candidature> {
        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, { statut: 'REFUSE', commentaires: note || '' });
    }

    addNote(id: string, note: string): Observable<Candidature> {
        return this.http.put<Candidature>(`${this.baseUrl}/${id}/notes`, { note });
    }

    getHistorique(id: string): Observable<CandidatureLog[]> {
        return this.http.get<CandidatureLog[]>(`${this.baseUrl}/${id}/historique`);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/${id}`);
    }
}
