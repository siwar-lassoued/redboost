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

        const size = filters?.limit?.toString() || '1000'; // Still default to 1000 if needed, but allow override
        const allParams = { ...params.keys().reduce((acc: any, key) => ({ ...acc, [key]: params.get(key) }), {}), size };
        
        return this.http.get<any>(`${this.baseUrl}/admin/all`, { params: allParams }).pipe(
            map(res => {
                let items: any[] = res.content || res.data || (Array.isArray(res) ? res : []);
                let filtered = items;

                if (filters?.type) {
                    if (filters.type === 'spontanees') {
                        filtered = []; // Not supported yet in this entity
                    } else {
                        // Backend now handles filtering by type for coaches and entrepreneurs
                        filtered = items;
                    }
                }
                if (filters?.statut) {
                    filtered = filtered.filter((c: any) => c.statut === filters.statut);
                }

                const mappedData: Candidature[] = filtered.map((c: any) => ({
                    id: c.id,
                    type: 'entrepreneurs',
                    nom: c.nomPrenom || 'Inconnu',
                    email: c.email || 'N/A',
                    phone: c.numeroTelephone || '—',
                    statut: c.statut,
                    submittedAt: c.dateCreationCandidature || c.dateSoumission || null,
                    programme: c.programme?.nom || null,
                    round: '—',
                    history: [],
                    documents: (c.documents && c.documents.length > 0) ? c.documents.map((d: string) => ({ name: d.split('/').pop() || 'Document', size: '—' })) : [],
                    formAnswers: [
                        { questionId: 1, question: 'Nom de l\'entreprise', answer: c.nomEntreprise, type: 'text-court' as const },
                        { questionId: 2, question: 'Secteur d\'activité', answer: c.secteurActivite, type: 'text-court' as const },
                        { questionId: 3, question: 'Stade d\'avancement', answer: c.stadeAvancement, type: 'text-court' as const },
                        { questionId: 4, question: 'Brève description', answer: c.breveDescription, type: 'text-long' as const },
                        { questionId: 5, question: 'Composante innovation', answer: c.composanteInnovation, type: 'text-long' as const },
                        { questionId: 6, question: 'Chiffre d\'affaires', answer: c.chiffreAffaires, type: 'text-court' as const },
                        { questionId: 7, question: 'Site Web', answer: c.lienWebsite, type: 'text-court' as const },
                        { questionId: 8, question: 'Profil LinkedIn', answer: c.lienLinkedin, type: 'text-court' as const }
                    ].filter(a => a.answer != null && a.answer !== ''),
                    noteInterne: c.commentairesAdmin || c.noteInterne || null,
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
        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, {
            statut: body.statut,
            commentaires: body.noteInterne || body.motifRejet || ''
        });
    }

    accept(id: string): Observable<Candidature> {
        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, { statut: 'ACCEPTE', commentaires: '' });
    }

    reject(id: string, note?: string): Observable<Candidature> {
        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, { statut: 'REJETE', commentaires: note || '' });
    }

    addNote(id: string, note: string): Observable<Candidature> {
        return this.http.put<Candidature>(`${this.baseUrl}/${id}/notes`, { note });
    }

    getHistorique(id: string): Observable<CandidatureLog[]> {
        return this.http.get<CandidatureLog[]>(`${this.baseUrl}/${id}/historique`);
    }

    getStatistics(): Observable<Record<string, number>> {
        return this.http.get<Record<string, number>>(`${this.baseUrl}/admin/statistics`);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/admin/${id}`);
    }
}
