import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Message } from '../../../core/services/message.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

interface CoachContact {
  id: string;
  name: string;
  company?: string;
  avatar: string;
}

@Component({
  selector: 'app-coach-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">
      <div class="page-header">
          <h1>Chat</h1>
          <p>Communiquez avec vos entrepreneurs</p>
      </div>

      <div class="chat-container">
          
          <div class="contacts-panel">
              <div class="search-contacts">
                  <i class="pi pi-search"></i>
                  <input
                    type="text"
                    placeholder="Rechercher un entrepreneur..."
                    [(ngModel)]="searchTerm"
                    (ngModelChange)="applyFilter()"
                  />
              </div>

              <div class="contacts-list">
                  <div
                    *ngFor="let contact of filteredContacts"
                    class="contact-item"
                    [class.active]="selectedContact?.id === contact.id"
                    (click)="selectContact(contact)">
                      <div class="avatar-sm purple-avatar">{{contact.avatar}}</div>
                      <div class="contact-info">
                          <div class="contact-name">{{contact.name}}</div>
                          <div class="contact-sub">{{contact.company || 'Entrepreneur'}}</div>
                      </div>
                      <div class="online-dot"></div>
                  </div>
                  <div *ngIf="!filteredContacts.length" class="empty-list">Aucun entrepreneur assigné.</div>
              </div>
          </div>

          <div class="chat-area" *ngIf="selectedContact; else emptyChat">
              <div class="chat-header">
                  <div class="flex items-center gap-3">
                      <div class="avatar-sm purple-avatar">{{selectedContact.avatar}}</div>
                      <div>
                          <div class="chat-contact-name">{{selectedContact.name}}</div>
                          <div class="chat-contact-status">{{selectedContact.company || 'Entrepreneur'}} · <span class="text-green-500">En ligne</span></div>
                      </div>
                  </div>
              </div>

              
              <div class="messages-area">
                  <div *ngFor="let msg of messages" class="message" [class.sent]="msg.expediteurId === currentUserId" [class.received]="msg.expediteurId !== currentUserId">
                      <div *ngIf="msg.expediteurId !== currentUserId" class="avatar-xs purple-avatar">{{selectedContact.avatar}}</div>
                      <div class="message-bubble" [class.sent-bubble]="msg.expediteurId === currentUserId" [class.received-bubble]="msg.expediteurId !== currentUserId">
                          <p>{{msg.contenu}}</p>
                          <span class="msg-time">{{formatTime(msg.sentAt || msg.timestamp)}}</span>
                      </div>
                  </div>
              </div>

              <!-- Input Bar -->
              <div class="chat-input-bar">
                  <input type="text" placeholder="Écrivez un message..." [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" />
                  <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
                      <i class="pi pi-send"></i>
                  </button>
              </div>
          </div>
          <ng-template #emptyChat>
            <div class="empty-chat">Sélectionnez un entrepreneur pour démarrer la conversation.</div>
          </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .chat-page { padding: 2rem; background: #f8f9fa; min-height: calc(100vh - 70px); font-family: var(--font-family); margin-top: -1rem; }
    .page-header h1 { font-size: 2.2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1.1rem; margin-top: 0.3rem; margin-bottom: 1.5rem; }

    .chat-container { display: flex; background: white; border-radius: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; height: calc(100vh - 200px); min-height: 500px; }
    .contacts-panel { width: 320px; border-right: 1px solid #EDF2F7; display: flex; flex-direction: column; }
    .search-contacts { position: relative; padding: 1.2rem; border-bottom: 1px solid #EDF2F7; }
    .search-contacts input { width: 100%; padding: 0.7rem 1rem 0.7rem 2.5rem; border-radius: 10px; border: 1px solid #E2E8F0; background: #F8FAFC; font-size: 0.9rem; }
    .search-contacts i { position: absolute; left: 2rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }

    .contacts-list { flex: 1; overflow-y: auto; }
    .contact-item { display: flex; align-items: center; gap: 0.8rem; padding: 1rem 1.2rem; cursor: pointer; }
    .contact-item:hover { background: #F8FAFC; }
    .contact-item.active { background: #FFF5F7; border-left: 3px solid #FF4D85; }
    .contact-info { flex: 1; }
    .contact-name { font-weight: 600; color: #2D3748; font-size: 0.95rem; }
    .contact-sub { color: #A0AEC0; font-size: 0.8rem; }
    .online-dot { width: 10px; height: 10px; border-radius: 50%; background: #48BB78; }

    /* Chat Area */
    .chat-area { flex: 1; display: flex; flex-direction: column; }
    .chat-header { padding: 1rem 1.5rem; border-bottom: 1px solid #EDF2F7; }
    .chat-contact-name { font-weight: 700; color: #2D3748; font-size: 1.05rem; }
    .chat-contact-status { color: #A0AEC0; font-size: 0.85rem; }

    .messages-area { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .message { display: flex; gap: 0.6rem; align-items: flex-end; }
    .message.sent { justify-content: flex-end; }
    .message-bubble { max-width: 70%; padding: 0.8rem 1.2rem; border-radius: 1rem; }
    .received-bubble { background: #F7FAFC; color: #2D3748; border-bottom-left-radius: 4px; }
    .sent-bubble { background: linear-gradient(135deg, #FF6B9E, #C850C0); color: white; border-bottom-right-radius: 4px; }
    .message-bubble p { margin: 0; font-size: 0.95rem; }
    .msg-time { font-size: 0.7rem; opacity: 0.7; display: block; text-align: right; margin-top: 0.3rem; }

    .chat-input-bar { display: flex; gap: 0.8rem; padding: 1rem 1.5rem; border-top: 1px solid #EDF2F7; }
    .chat-input-bar input { flex: 1; padding: 0.8rem 1.2rem; border-radius: 25px; border: 1px solid #E2E8F0; }
    .send-btn { width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #FF6B9E, #C850C0); color: white; border: none; }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .avatar-sm { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.85rem; flex-shrink: 0; }
    .avatar-xs { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.65rem; flex-shrink: 0; }
    
    .purple-avatar { background: linear-gradient(135deg, #B794F4, #805AD5); }

    .empty-list, .empty-chat { margin: auto; color: #A0AEC0; padding: 1.5rem; }
  `]
})
export class CoachChatComponent implements OnInit {
  currentUserId = '';
  searchTerm = '';
  newMessage = '';
  contacts: CoachContact[] = [];
  filteredContacts: CoachContact[] = [];
  selectedContact: CoachContact | null = null;
  messages: Message[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser$.value;
    if (!user?.id) {
      return;
    }

   this.currentUserId = String(user.id);
    this.loadAssignedEntrepreneurs();
  }

  loadAssignedEntrepreneurs(): void {
    this.userService.getEntrepreneursByCoach(this.currentUserId).subscribe({
      next: (users) => {
        this.contacts = users.map((u) => ({
          id: u.id,
          name: `${u.prenom} ${u.nom}`.trim(),
          company: u.startupName || u.startup,
          avatar: `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase(),
        }));
        this.filteredContacts = [...this.contacts];
        if (this.filteredContacts.length) {
          this.selectContact(this.filteredContacts[0]);
        }
      },
      error: () => {
        this.contacts = [];
        this.filteredContacts = [];
      },
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredContacts = [...this.contacts];
      return;
    }
        this.filteredContacts = this.contacts.filter((contact) =>
      contact.name.toLowerCase().includes(term)
      || (contact.company || '').toLowerCase().includes(term)
    );
  }

  selectContact(contact: CoachContact): void {
    this.selectedContact = contact;
    this.loadConversation(contact.id);
  }

  loadConversation(otherUserId: string): void {
    this.messageService.getConversation(this.currentUserId, otherUserId).subscribe({
      next: (history) => {
        this.messages = history || [];
        this.messageService.markAsRead(this.currentUserId, otherUserId).subscribe({ error: () => {} });
      },
      error: () => {
        this.messages = [];
      },
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || !this.selectedContact) {
      return;
    }

    this.messageService.sendMessage(this.currentUserId, this.selectedContact.id, content).subscribe({
      next: (saved) => {
        this.messages = [...this.messages, saved];
        this.newMessage = '';
      },
      error: () => {},
    });
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}
