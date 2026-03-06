import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { TemplateService } from '../../template.service';
import { TemplateResponse, TemplateDataRow, ExportDataRequest } from '../../../../../models/template.models';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ImportDialogComponent } from '../../dialogs/import_dialog/import_dialog';
import { ExportDialogComponent ,ExportConfig} from '../../dialogs/export_dialog/export_dialog';

@Component({
  selector: 'app-template-data-management',
  templateUrl: './data_management.html',
  styleUrls: ['./data_management.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ]
})
export class TemplateDataManagementComponent implements OnInit {
  template: TemplateResponse | null = null;
  dataRows: TemplateDataRow[] = [];
  filteredDataRows: TemplateDataRow[] = [];
  displayedColumns: string[] = [];
  tableColumns: string[] = []; // includes select, ID_UNIQUE, dynamic columns, actions
  searchText: string = '';
  loading: boolean = false;
  selection = new SelectionModel<TemplateDataRow>(true, []);

  // Filters
  showFilters: boolean = false;
  filters: { [key: string]: string } = {};

  // Inline editing
  editingRowId: string | null = null;
  editingRowData: { [key: string]: any } = {};
  isNewRow: boolean = false;

  private templateColors: string[] = [
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
    'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
  ];

  private templateIcons: string[] = ['business_center', 'star', 'groups', 'event'];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private templateService: TemplateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const templateId = this.route.snapshot.paramMap.get('id');
    if (templateId) {
      this.loadTemplate(+templateId);
      this.loadData(+templateId);
    }
  }

  loadTemplate(templateId: number): void {
    this.templateService.getTemplate(templateId).subscribe({
      next: (template) => {
        this.template = template;
        this.setupColumns();
      },
      error: () => this.showError('Erreur lors du chargement du template')
    });
  }

  loadData(templateId: number): void {
    this.loading = true;
    this.templateService.getAllData(templateId).subscribe({
      next: (data) => {
        this.dataRows = data;
        this.filteredDataRows = data;
        this.loading = false;
      },
      error: () => {
        this.showError('Erreur lors du chargement des données');
        this.loading = false;
      }
    });
  }

  setupColumns(): void {
    if (this.template) {
      this.displayedColumns = this.template.columns
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(col => col.columnName);

      this.tableColumns = ['select', 'ID_UNIQUE', ...this.displayedColumns, 'actions'];

      // Initialize filters
      this.filters = { 'ID_UNIQUE': '' };
      this.displayedColumns.forEach(col => this.filters[col] = '');
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (!this.showFilters) {
      this.clearFilters();
    }
  }

  clearFilters(): void {
    this.filters = { 'ID_UNIQUE': '' };
    this.displayedColumns.forEach(col => this.filters[col] = '');
    this.filteredDataRows = this.dataRows;
  }

  applyFilters(): void {
    this.filteredDataRows = this.dataRows.filter(row => {
      if (this.filters['ID_UNIQUE'] && 
          !row.rowId.toLowerCase().includes(this.filters['ID_UNIQUE'].toLowerCase())) {
        return false;
      }

      for (const col of this.displayedColumns) {
        const filterVal = this.filters[col]?.toLowerCase() || '';
        const cellVal = (row.data[col] || '').toString().toLowerCase();
        if (filterVal && !cellVal.includes(filterVal)) {
          return false;
        }
      }
      return true;
    });
  }

  onSearch(): void {
    if (!this.searchText.trim()) {
      this.filteredDataRows = this.dataRows;
      return;
    }
    const search = this.searchText.toLowerCase();
    this.filteredDataRows = this.dataRows.filter(row =>
      Object.values(row.data).some(val =>
        val?.toString().toLowerCase().includes(search)
      )
    );
  }

  goBack(): void {
    this.location.back();
  }

  startAddRow(): void {
    if (this.editingRowId) this.cancelEditing();

    const emptyRow: TemplateDataRow = { rowId: 'new-temp-id', data: {} };
    this.displayedColumns.forEach(col => emptyRow.data[col] = '');

    this.editingRowId = 'new-temp-id';
    this.editingRowData = { ...emptyRow.data };
    this.isNewRow = true;

    this.dataRows = [emptyRow, ...this.dataRows];
    this.filteredDataRows = this.dataRows;
  }

  startEditRow(row: TemplateDataRow): void {
    if (this.editingRowId) this.cancelEditing();

    this.editingRowId = row.rowId;
    this.editingRowData = { ...row.data };
    this.isNewRow = false;
  }

  /**
   * Format data according to column types before sending to backend
   */
  private formatDataForBackend(data: { [key: string]: any }): { [key: string]: any } {
    if (!this.template) return data;

    const formattedData: { [key: string]: any } = {};

    for (const [columnName, value] of Object.entries(data)) {
      const column = this.template.columns.find(c => c.columnName === columnName);
      
      if (!column) {
        formattedData[columnName] = value;
        continue;
      }

      // Skip empty values
      if (value === null || value === undefined || value === '') {
        formattedData[columnName] = '';
        continue;
      }

      switch (column.columnType) {
        case 'DATE':
          // Convert to YYYY-MM-DD format
          formattedData[columnName] = this.formatDateForBackend(value);
          break;
        
        case 'NUMBER':
          // Ensure it's a number
          formattedData[columnName] = value === '' ? '' : Number(value);
          break;
        
        case 'BOOLEAN':
          // Convert to boolean
          if (typeof value === 'string') {
            formattedData[columnName] = value.toLowerCase() === 'true' || value === '1';
          } else {
            formattedData[columnName] = Boolean(value);
          }
          break;
        
        default:
          // TEXT, EMAIL, PHONE, etc. - keep as string
          formattedData[columnName] = String(value);
      }
    }

    return formattedData;
  }

  /**
   * Format date to YYYY-MM-DD format expected by backend
   */
  private formatDateForBackend(value: any): string {
    if (!value) return '';

    // If it's already in YYYY-MM-DD format, return it
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return value; // Return original value if invalid
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      return value; // Return original value if error
    }
  }

  saveRow(): void {
    if (!this.template || !this.editingRowId) return;

    // Format data before sending to backend
    const payload = this.formatDataForBackend(this.editingRowData);

    if (this.isNewRow) {
      this.templateService.addDataRow(this.template.id, payload).subscribe({
        next: (res) => {
          const newRow = { rowId: res.rowId, data: this.editingRowData };
          this.dataRows = this.dataRows.map(r => r.rowId === 'new-temp-id' ? newRow : r);
          this.filteredDataRows = this.dataRows;
          this.resetEditing();
          this.showSuccess('Enregistrement ajouté');
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Erreur lors de l\'ajout';
          this.showError(errorMsg);
        }
      });
    } else {
      this.templateService.updateDataRow(this.template.id, this.editingRowId, payload).subscribe({
        next: () => {
          this.dataRows = this.dataRows.map(r =>
            r.rowId === this.editingRowId ? { ...r, data: this.editingRowData } : r
          );
          this.filteredDataRows = this.dataRows;
          this.resetEditing();
          this.showSuccess('Enregistrement modifié');
        },
        error: (err) => {
          const errorMsg = err.error?.message || 'Erreur lors de la modification';
          this.showError(errorMsg);
        }
      });
    }
  }

  cancelEditing(): void {
    if (this.isNewRow) {
      this.dataRows = this.dataRows.filter(r => r.rowId !== 'new-temp-id');
      this.filteredDataRows = this.dataRows;
    }
    this.resetEditing();
  }

  private resetEditing(): void {
    this.editingRowId = null;
    this.isNewRow = false;
    this.editingRowData = {};
  }

  deleteRow(row: TemplateDataRow): void {
    if (!this.template) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement ?')) {
      this.templateService.deleteDataRow(this.template.id, row.rowId).subscribe({
        next: () => {
          this.dataRows = this.dataRows.filter(r => r.rowId !== row.rowId);
          this.filteredDataRows = this.dataRows;
          this.showSuccess('Enregistrement supprimé');
        },
        error: () => this.showError('Erreur lors de la suppression')
      });
    }
  }

  isRowEditing(row: TemplateDataRow): boolean {
    return this.editingRowId === row.rowId || (this.isNewRow && row.rowId === 'new-temp-id');
  }

  getCellValue(row: TemplateDataRow, column: string): any {
    return this.isRowEditing(row) ? this.editingRowData[column] : row.data[column];
  }

  onCellInput(column: string, value: any): void {
    this.editingRowData[column] = value;
  }

  /**
   * Get the input type for a column based on its type
   */
  getInputType(columnName: string): string {
    const column = this.template?.columns.find(c => c.columnName === columnName);
    if (!column) return 'text';

    switch (column.columnType) {
      case 'DATE':
        return 'date';
      case 'NUMBER':
        return 'number';
      case 'EMAIL':
        return 'email';
      case 'PHONE':
        return 'tel';
      case 'BOOLEAN':
        return 'checkbox';
      default:
        return 'text';
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveRow();
    } else if (event.key === 'Escape') {
      this.cancelEditing();
    }
  }

  // Selection helpers
  selectRow(row: TemplateDataRow): void {
    this.selection.toggle(row);
  }

  masterToggle(): void {
    this.isAllSelected() ? this.selection.clear() : this.filteredDataRows.forEach(r => this.selection.select(r));
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.filteredDataRows.length;
  }

  getColumnType(columnName: string): string {
    return this.template?.columns.find(c => c.columnName === columnName)?.columnType || 'TEXT';
  }

  isRequiredColumn(columnName: string): boolean {
    return this.template?.columns.find(c => c.columnName === columnName)?.isRequired || false;
  }

  getTemplateIcon(): string {
    return this.templateIcons[(this.template?.id || 1) % this.templateIcons.length];
  }

  getTemplateColor(): string {
    return this.templateColors[(this.template?.id || 1) % this.templateColors.length];
  }

  exportExcel(): void {
    if (!this.template) return;

    const hasActiveFilters = this.hasActiveFilters();

    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        template: this.template,
        totalRecords: this.dataRows.length,
        filteredRecords: this.filteredDataRows.length,
        hasActiveFilters: hasActiveFilters
      }
    });

    dialogRef.afterClosed().subscribe((config: ExportConfig | null) => {
      if (config) {
        this.performExport(config);
      }
    });
  }

  private hasActiveFilters(): boolean {
    return this.showFilters || this.searchText.trim().length > 0 || 
           Object.values(this.filters).some(f => f && f.trim().length > 0);
  }

  private performExport(config: ExportConfig): void {
    if (!this.template) return;

    // Determine which data to export
    const dataToExport = config.scope === 'filtered' ? this.filteredDataRows : this.dataRows;

    // Get column IDs from column names
    const columnIds = this.getColumnIds(config.columns);

    // Get row IDs from the data to export
    const rowIds = config.scope === 'filtered' 
      ? dataToExport.map(row => row.rowId)
      : undefined; // undefined means export all

    // Call the appropriate export method based on format
    if (config.format === 'xlsx') {
      this.exportToExcel(columnIds, config.includeHeaders, rowIds);
    } else {
      this.exportToCSV(columnIds, config.includeHeaders, rowIds);
    }
  }

  private getColumnIds(columnNames: string[]): number[] {
    if (!this.template) return [];
    
    const columnIds: number[] = [];
    
    columnNames.forEach(name => {
      if (name !== 'ID_UNIQUE') {
        const column = this.template!.columns.find(c => c.columnName === name);
        if (column && column.id) {
          columnIds.push(column.id);
        }
      }
    });
    
    return columnIds;
  }

  private exportToExcel(columnIds: number[], includeHeaders: boolean, rowIds?: string[]): void {
    if (!this.template) return;

    const exportRequest: ExportDataRequest = {
      columnIds: columnIds.length > 0 ? columnIds : undefined,
      exportFormat: 'EXCEL',
      includeHeaders: includeHeaders,
      exportFiltered: rowIds !== undefined,
      rowIds: rowIds
    };

    this.templateService.exportData(this.template.id, exportRequest).subscribe({
      next: (blob) => {
        const filename = `${this.template!.name}_${Date.now()}.xlsx`;
        this.templateService.downloadFile(blob, filename);
        const recordCount = rowIds ? rowIds.length : this.dataRows.length;
        this.showSuccess(`Export Excel réussi (${recordCount} enregistrements, ${columnIds.length || this.displayedColumns.length} colonnes)`);
      },
      error: () => this.showError('Erreur lors de l\'export Excel')
    });
  }

  private exportToCSV(columnIds: number[], includeHeaders: boolean, rowIds?: string[]): void {
    if (!this.template) return;

    const exportRequest: ExportDataRequest = {
      columnIds: columnIds.length > 0 ? columnIds : undefined,
      exportFormat: 'CSV',
      includeHeaders: includeHeaders,
      exportFiltered: rowIds !== undefined,
      rowIds: rowIds
    };

    this.templateService.exportData(this.template.id, exportRequest).subscribe({
      next: (blob) => {
        const filename = `${this.template!.name}_${Date.now()}.csv`;
        this.templateService.downloadFile(blob, filename);
        const recordCount = rowIds ? rowIds.length : this.dataRows.length;
        this.showSuccess(`Export CSV réussi (${recordCount} enregistrements, ${columnIds.length || this.displayedColumns.length} colonnes)`);
      },
      error: () => this.showError('Erreur lors de l\'export CSV')
    });
  }

  openImportDialog(): void {
    if (!this.template) return;

    const dialogRef = this.dialog.open(ImportDialogComponent, {
      width: '600px',
      data: { template: this.template }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Données importées avec succès');
        this.loadData(this.template!.id);
      }
    });
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'OK', { duration: 5000, panelClass: ['error-snackbar'] });
  }
}