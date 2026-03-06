// src/app/directives/drag-drop.directive.ts
import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
    selector: '[appDragDrop]',
    standalone: true,
})
export class DragDropDirective {
    @Output() filesDropped = new EventEmitter<FileList>();

    @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        evt.dataTransfer!.dropEffect = 'copy';
    }

    @HostListener('dragleave', ['$event']) onDragLeave(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    @HostListener('drop', ['$event']) onDrop(evt: DragEvent) {
        evt.preventDefault();
        evt.stopPropagation();
        if (evt.dataTransfer?.files) {
            this.filesDropped.emit(evt.dataTransfer.files);
        }
    }
}
