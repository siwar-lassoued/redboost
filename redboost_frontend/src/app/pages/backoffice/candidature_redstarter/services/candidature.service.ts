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
        
        // Use 'size' as the primary pagination limit parameter for Spring Data
        const size = filters?.limit?.toString() || '1000';
        params = params.set('size', size);
        
        return this.http.get<any>(`${this.baseUrl}/admin/all`, { params }).pipe(
            map(res => {
                let items: any[] = res.content || res.data || (Array.isArray(res) ? res : []);
                let filtered = items;

                if (filters?.type) {
                    if (filters.type === 'spontanees') {
                        // Backend now handles filtering for spontaneous (formTemplateId is null)
                        filtered = items;
                    } else {
                        // Backend handles filtering by type for coaches and entrepreneurs
                        filtered = items;
                    }
                }
                if (filters?.statut) {
                    filtered = filtered.filter((c: any) => c.statut === filters.statut);
                }

                const mappedData: Candidature[] = items.map((c: any) => {
                    let formAnswers: any[] = [];
                    try {
                        if (c.dynamicAnswers) {
                            const parsed = JSON.parse(c.dynamicAnswers);
                            formAnswers = Object.entries(parsed).map(([q, a], idx) => ({
                                questionId: idx,
                                question: q,
                                answer: a,
                                type: (Array.isArray(a) ? 'qcm' : typeof a === 'string' && a.length > 50 ? 'text-long' : 'text-court') as any
                            }));
                        }
                    } catch (e) {
                         console.error('Error parsing dynamicAnswers', e);
                    }

                    // Fallback to legacy fields if dynamicAnswers is empty
                    if (formAnswers.length === 0) {
                        formAnswers = [
                            { questionId: 1, question: 'Nom de l\'entreprise', answer: c.nomEntreprise, type: 'text-court' as const },
                            { questionId: 2, question: 'Brève description', answer: c.breveDescription, type: 'text-long' as const },
                            { questionId: 3, question: 'Phase de maturité', answer: c.phaseMaturite, type: 'text-court' as const },
                            { questionId: 4, question: 'Impact Social', answer: c.impactSocial, type: 'text-long' as const }
                        ].filter(a => !!a.answer);
                    }

                    return {
                        id: c.id,
                        type: c.formTemplateId ? (c.statut === 'COACH' ? 'coaches' : 'entrepreneurs') : 'spontanees', // Basic logic, refined below
                        nom: c.nomPrenom || 'Inconnu',
                        email: c.email || 'N/A',
                        phone: c.numeroTelephone || '—',
                        statut: c.statut,
                        submittedAt: c.dateCreationCandidature || c.dateSoumission || null,
                        programme: c.nomEntreprise || '—',
                        round: '—',
                        history: [],
                        documents: (c.documents && c.documents.length > 0) ? c.documents.map((d: string) => ({ name: d.split('/').pop() || 'Document', size: '—' })) : [],
                        formAnswers,
                        noteInterne: c.commentairesAdmin || null,
                        motifRejet: c.motifRejet || null,
                        cvUrl: c.cvUrl || null
                    };
                });

              
                const finalData = mappedData.map(c => {
                   if (filters?.type) c.type = filters.type;
                   return c;
                });

                return { data: finalData };
            })
        );
    }

    getById(id: string): Observable<Candidature> {
        return this.http.get<Candidature>(`${this.baseUrl}/admin/${id}`);
    }

    create(data: Partial<Candidature>): Observable<Candidature> {
        return this.http.post<Candidature>(`${this.baseUrl}/submit`, data);
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
       
        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, { commentaires: note });
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

    cleanupAnonymous(): Observable<any> {
        return this.http.delete<any>(`${this.baseUrl}/admin/cleanup-anonymous`);
    }
}
