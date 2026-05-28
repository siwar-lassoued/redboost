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

export interface HistoricalCandidatureResult {
    candidature: any;
    historicalStatut: string;
    historicalDate: string;
    historicalFaitPar: string | null;
    historicalNote: string | null;
    historicalStatutAvant: string | null;
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


                const mappedData: Candidature[] = items.map((c: any) => {
                    let formAnswers: any[] = [];
                    try {
                        if (c.dynamicAnswers) {
                            let parsed = JSON.parse(c.dynamicAnswers);
                            // Handle nested { answers: { ... } } structure
                            if (parsed.answers && typeof parsed.answers === 'object' && !Array.isArray(parsed.answers)) {
                                parsed = parsed.answers;
                            }
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

                    // Determine base profile type from backend
                    let resolvedType: 'coaches' | 'entrepreneurs' | 'spontanees' = 'spontanees';
                    let deductedProfile: 'coaches' | 'entrepreneurs' | 'spontanees' = 'spontanees';

                    // Enforce "spontanees" if programme indicates it
                    const progStr = (c.programme || '').toLowerCase();
                    const isProgSpontanee = progStr.includes('spontanée') || progStr.includes('spontanee') || progStr.includes('spontanné');

                    if (c.profileType && !isProgSpontanee) {
                        const pt = c.profileType.toLowerCase();
                        if (pt === 'coach' || pt === 'coaches') {
                            resolvedType = 'coaches';
                            deductedProfile = 'coaches';
                        }
                        else if (pt === 'entrepreneur' || pt === 'entrepreneurs') {
                            resolvedType = 'entrepreneurs';
                            deductedProfile = 'entrepreneurs';
                        }
                    }

                    // Check formAnswers for profile choice (spontaneous candidatures)
                    if (resolvedType === 'spontanees' && formAnswers.length > 0) {
                        // More robust check: Look for explicit answers containing "coach" or "entrepreneur" in QCM or short text
                        const profileAnswer = formAnswers.find((a: any) => {
                            if (a.type === 'text-long' || !a.answer) return false;
                            let val = a.answer;
                            if (Array.isArray(val)) val = val[0];
                            if (typeof val === 'string') {
                                const v = val.toLowerCase();
                                return v.includes('coach') || v.includes('entrepreneur');
                            }
                            return false;
                        });
                        
                        if (profileAnswer) {
                            let val = profileAnswer.answer;
                            if (Array.isArray(val)) val = val[0];
                            if (typeof val === 'string') {
                                if (val.toLowerCase().includes('coach')) deductedProfile = 'coaches';
                                else if (val.toLowerCase().includes('entrepreneur')) deductedProfile = 'entrepreneurs';
                            }
                        }
                    }

                    // Ultimate fallback: check roleEntreprise for old records
                    if (deductedProfile === 'spontanees' && c.roleEntreprise) {
                        const rol = c.roleEntreprise.toLowerCase();
                        if (rol.includes('coach')) deductedProfile = 'coaches';
                        else if (rol.includes('entrepreneur')) deductedProfile = 'entrepreneurs';
                    }

                    // Determine phone from dynamicAnswers if invalid/missing
                    let phoneStr = c.numeroTelephone;
                    if (phoneStr === 'undefined' || phoneStr === 'null' || phoneStr === null || phoneStr === '00000000' || phoneStr === '000000000') {
                        phoneStr = '';
                    }
                    if (!phoneStr && formAnswers.length > 0) {
                        const phoneAnswer = formAnswers.find((a: any) => {
                            if (!a.answer || a.type === 'upload' || a.type === 'qcm' || a.type === 'qcu') return false;
                            const q = a.question.toLowerCase();
                            return q.includes('téléphone') || q.includes('telephone') || q.includes('phone') || q.includes('tel');
                        });
                        if (phoneAnswer) {
                            let val = phoneAnswer.answer;
                            if (Array.isArray(val)) val = val[0];
                            if (typeof val === 'string') phoneStr = val;
                        }
                    }

                    return {
                        id: c.id,
                        type: resolvedType,
                        deductedProfile: deductedProfile,
                        nom: c.nomPrenom && c.nomPrenom !== 'undefined' ? c.nomPrenom : 'Inconnu',
                        email: c.email && c.email !== 'undefined' ? c.email : 'N/A',
                        phone: phoneStr || '—',
                        statut: c.statut,
                        submittedAt: c.dateCreationCandidature || c.dateSoumission || null,
                        programme: c.programme || null,
                        round: '—',
                        history: [],
                        documents: (c.documents && c.documents.length > 0) ? c.documents.map((d: string) => ({ 
                            name: d.split('/').pop() || 'Document', 
                            size: '—',
                            url: `${environment.apiUrl}/documents/candidatures/${d.split('/').pop()}`
                        })) : [],
                        formAnswers,
                        noteInterne: c.commentairesAdmin || null,
                        motifRejet: c.motifRejet || null,
                        cvUrl: c.cvUrl || null
                    };
                });

                return { data: mappedData };
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

    processStatus(id: string | number, status: CandidatureStatus, emailContent: string, subject: string, createAccount: boolean): Observable<{ success: boolean; message: string; candidature: any }> {
        return this.http.post<{ success: boolean; message: string; candidature: any }>(
            `${this.baseUrl}/admin/${id}/process-status`,
            { statut: status, emailContent, subject, createAccount }
        );
    }

    addNote(id: string, note: string): Observable<Candidature> {
       
        return this.http.put<Candidature>(`${this.baseUrl}/admin/${id}/status`, { commentaires: note });
    }

    getHistorique(id: string): Observable<CandidatureLog[]> {
        return this.http.get<CandidatureLog[]>(`${this.baseUrl}/${id}/historique`);
    }

    getByHistoricalStatus(statut: string): Observable<HistoricalCandidatureResult[]> {
        return this.http.get<HistoricalCandidatureResult[]>(
            `${this.baseUrl}/admin/history-by-status`,
            { params: { statut } }
        );
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

    migrateLegacy(): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/admin/migrate-legacy`, {});
    }

    exportCSV(filters?: CandidatureFilters): Observable<Blob> {
        let params = new HttpParams();
        if (filters?.programme) params = params.set('programme', filters.programme);
        if (filters?.statut) params = params.set('statut', filters.statut);
        if (filters?.type) params = params.set('type', filters.type);
        if (filters?.search) params = params.set('search', filters.search);

        return this.http.get(`${this.baseUrl}/admin/export-csv`, {
            params,
            responseType: 'blob'
        });
    }
}
