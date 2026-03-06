export interface CoachRequest {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    yearsOfExperience?: number;
    skills?: string;
    expertise?: string;
    status: string;
    createdAt?: string;
    binomeInvitationToken?: string | null;
    relatedBinomeRequestId?: number | null;
    binomeEmail?: string;
    isCertified?: boolean;
    totalProposedFee?: number;
    cvUrl?: string;
    trainingProgramUrl?: string;
    certificationDocuments?: {
        id: number;
        documentUrl: string;
        documentName: string;
        documentType: string;
    }[];
    processing?: {
        coachRequestId: number;
        originalRequestId: number;
        profileScore?: number;
        cvScore?: number;
        trainingProgramScore?: number;
        certificationScore?: number;
        overallScore?: number;
        classificationStatus?: string;
        classificationReasons?: string;
    };
    binome: boolean;
}
