export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'session' | 'task' | 'matching' | 'rapport' | 'evaluation';
    read: boolean;
    date: Date;
}
