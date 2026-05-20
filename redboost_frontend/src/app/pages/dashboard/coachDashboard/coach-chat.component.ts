import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Message } from '../../../core/services/message.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService, ChatMessage } from '../../../core/services/socket.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

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
        <p>Communiquez avec vos entrepreneurs en temps réel</p>
      </div>

      <div class="chat-container">

        <!-- Contacts Panel -->
        <div class="contacts-panel">
          <div class="search-contacts">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
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
              <div class="avatar-sm">{{contact.avatar}}</div>
              <div class="contact-info">
                <div class="contact-name">{{contact.name}}</div>
                <div class="contact-sub">{{contact.company || 'Entrepreneur'}}</div>
              </div>
              <div class="online-dot"></div>
            </div>
            <div *ngIf="!filteredContacts.length" class="empty-list">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              Aucun entrepreneur assigné.
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div class="chat-area" *ngIf="selectedContact; else emptyChat">
          <div class="chat-header">
            <div class="chat-header-info">
              <div class="avatar-sm">{{selectedContact.avatar}}</div>
              <div>
                <div class="chat-contact-name">{{selectedContact.name}}</div>
                <div class="chat-contact-status">
                  {{selectedContact.company || 'Entrepreneur'}} ·
                  <span class="status-online">En ligne</span>
                </div>
              </div>
            </div>
          </div>

          <div class="messages-area" #scrollContainer>
            <div *ngFor="let msg of messages"
                 class="message"
                 [class.sent]="msg.expediteurId === currentUserId"
                 [class.received]="msg.expediteurId !== currentUserId">
              <div *ngIf="msg.expediteurId !== currentUserId" class="avatar-xs">{{selectedContact.avatar}}</div>
              <div class="message-bubble"
                   [class.sent-bubble]="msg.expediteurId === currentUserId"
                   [class.received-bubble]="msg.expediteurId !== currentUserId">
                <p>{{msg.contenu}}</p>
                <span class="msg-time">{{formatTime(msg.sentAt || msg.timestamp)}}</span>
              </div>
            </div>
            <div *ngIf="messages.length === 0" class="empty-messages">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
              <p>Commencez la conversation !</p>
            </div>
          </div>

          <div class="chat-input-bar">
            <input
              type="text"
              placeholder="Écrivez un message..."
              [(ngModel)]="newMessage"
              (keyup.enter)="sendMessage()"
            />
            <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>

        <ng-template #emptyChat>
          <div class="empty-chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
            <p>Sélectionnez un entrepreneur pour démarrer la conversation.</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    /* ── Page Layout ── */
    .chat-page {
      padding: 2rem;
      background: #F8FAFC;
      min-height: calc(100vh - 70px);
      font-family: var(--font-family, 'Inter', sans-serif);
    }
    .page-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1E293B;
      margin: 0;
    }
    .page-header p {
      color: #475569;
      font-size: 0.95rem;
      margin: 0.25rem 0 1.5rem;
    }

    /* ── Chat Container ── */
    .chat-container {
      display: flex;
      background: #fff;
      border-radius: 1.25rem;
      box-shadow: 0 4px 24px rgba(59,130,166,0.08);
      overflow: hidden;
      height: calc(100vh - 200px);
      min-height: 500px;
      border: 1px solid #E2EBF5;
    }

    /* ── Contacts Panel ── */
    .contacts-panel {
      width: 300px;
      border-right: 1px solid #E2EBF5;
      display: flex;
      flex-direction: column;
      background: #FAFBFF;
    }
    .search-contacts {
      position: relative;
      padding: 1rem;
      border-bottom: 1px solid #E2EBF5;
    }
    .search-icon {
      position: absolute;
      left: 1.75rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: #94A3B8;
    }
    .search-contacts input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.4rem;
      border-radius: 10px;
      border: 1.5px solid #E2E8F0;
      background: #fff;
      font-size: 0.875rem;
      color: #334155;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .search-contacts input:focus {
      outline: none;
      border-color: #3B82A6;
      box-shadow: 0 0 0 3px rgba(59,130,166,0.1);
    }

    /* ── Contact List ── */
    .contacts-list { flex: 1; overflow-y: auto; }
    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid #F1F5F9;
      transition: background 0.15s;
    }
    .contact-item:hover { background: #F0F7FF; }
    .contact-item.active {
      background: #EBF5FF;
      border-left: 3px solid #3B82A6;
    }
    .contact-info { flex: 1; min-width: 0; }
    .contact-name { font-weight: 600; color: #1E293B; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .contact-sub { color: #94A3B8; font-size: 0.78rem; margin-top: 1px; }
    .online-dot { width: 9px; height: 9px; border-radius: 50%; background: #10B981; flex-shrink: 0; }
    .empty-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #94A3B8;
      padding: 2.5rem 1rem;
      text-align: center;
      font-size: 0.875rem;
    }
    .empty-list svg { width: 40px; height: 40px; color: #CBD5E1; }

    /* ── Avatars ── */
    .avatar-sm {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 0.85rem;
      flex-shrink: 0;
      background: linear-gradient(135deg, #3B82A6, #475569);
    }
    .avatar-xs {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: white;
      font-size: 0.65rem;
      flex-shrink: 0;
      background: linear-gradient(135deg, #3B82A6, #475569);
    }

    /* ── Chat Area ── */
    .chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    .chat-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #E2EBF5;
      background: #fff;
    }
    .chat-header-info { display: flex; align-items: center; gap: 0.875rem; }
    .chat-contact-name { font-weight: 700; color: #1E293B; font-size: 0.95rem; }
    .chat-contact-status { color: #94A3B8; font-size: 0.82rem; margin-top: 1px; }
    .status-online { color: #10B981; font-weight: 600; }

    /* ── Messages ── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      background: #F8FAFC;
    }
    .message { display: flex; gap: 0.5rem; align-items: flex-end; }
    .message.sent { justify-content: flex-end; }

    .message-bubble {
      max-width: 68%;
      padding: 0.75rem 1.1rem;
      border-radius: 16px;
      line-height: 1.5;
    }
    .received-bubble {
      background: #fff;
      color: #1E293B;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      border: 1px solid #E2E8F0;
    }
    .sent-bubble {
      background: linear-gradient(135deg, #3B82A6, #2563A0);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .message-bubble p { margin: 0; font-size: 0.9rem; }
    .msg-time {
      font-size: 0.68rem;
      opacity: 0.65;
      display: block;
      text-align: right;
      margin-top: 0.3rem;
    }
    .empty-messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      color: #94A3B8;
      margin: auto;
      text-align: center;
      font-size: 0.9rem;
    }
    .empty-messages svg { width: 48px; height: 48px; color: #CBD5E1; }

    /* ── Input Bar ── */
    .chat-input-bar {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #E2EBF5;
      background: #fff;
      align-items: center;
    }
    .chat-input-bar input {
      flex: 1;
      padding: 0.75rem 1.1rem;
      border-radius: 12px;
      border: 1.5px solid #E2E8F0;
      font-size: 0.9rem;
      color: #334155;
      transition: border-color 0.2s;
    }
    .chat-input-bar input:focus {
      outline: none;
      border-color: #3B82A6;
      box-shadow: 0 0 0 3px rgba(59,130,166,0.1);
    }
    .send-btn {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #3B82A6, #2563A0);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 12px rgba(59,130,166,0.3);
    }
    .send-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(59,130,166,0.4);
    }
    .send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .send-btn svg { width: 18px; height: 18px; }

    /* ── Empty / Scrollbar ── */
    .empty-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: #94A3B8;
      font-size: 0.95rem;
    }
    .empty-chat svg { width: 52px; height: 52px; color: #CBD5E1; }

    .messages-area::-webkit-scrollbar { width: 5px; }
    .messages-area::-webkit-scrollbar-track { background: transparent; }
    .messages-area::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
  `]
})
export class CoachChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  currentUserId = '';
  searchTerm = '';
  newMessage = '';
  contacts: CoachContact[] = [];
  filteredContacts: CoachContact[] = [];
  selectedContact: CoachContact | null = null;
  messages: Message[] = [];

  private wsSub?: Subscription;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService,
    private socketService: SocketService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.id) {
        this.currentUserId = String(user.id);
        this.loadAssignedEntrepreneurs();
        this.connectWebSocket();
      }
    });
  }

  private connectWebSocket(): void {
    const token = this.authService.getToken();
    if (token) {
      this.socketService.connect(token);
      // Listen for incoming messages in real time
      this.wsSub = this.socketService.messageReceived$.subscribe((msg: any) => {
        if (this.selectedContact && msg.expediteurId === this.selectedContact.id) {
          // Map ChatMessage → Message shape
          this.messages = [...this.messages, {
            id: msg.id || String(Date.now()),
            expediteurId: msg.expediteurId,
            expediteurNom: '',
            expediteurPrenom: '',
            destinataireId: msg.destinataireId,
            contenu: msg.contenu,
            type: msg.type || 'TEXT',
            lu: false,
            timestamp: new Date(),
            sentAt: new Date(),
            fichierUrl: msg.fichierUrl,
            fichierNom: msg.fichierNom,
          }];
        }
      });
    }
  }

  loadAssignedEntrepreneurs(): void {
    this.userService.getEntrepreneursByCoach(this.currentUserId).subscribe({
      next: (users) => {
        const contactsMap = new Map<string, CoachContact>();
        users.forEach(u => {
          const id = String(u.id);
          if (!contactsMap.has(id)) {
            contactsMap.set(id, {
              id: id,
              name: `${(u as any).firstName || u.prenom || ''} ${(u as any).lastName || u.nom || ''}`.trim() || 'Utilisateur Inconnu',
              company: u.entreprise || u.startupName || u.startup || '',
              avatar: `${((u as any).firstName || u.prenom || '?')[0]}${((u as any).lastName || u.nom || '?')[0]}`.toUpperCase(),
            });
          }
        });
        this.contacts = Array.from(contactsMap.values());
        this.filteredContacts = [...this.contacts];

        // Auto-select contact from query param '?with=<userId>'
        const withId = this.route.snapshot.queryParamMap.get('with');
        if (withId) {
          const target = this.contacts.find(c => c.id === withId);
          if (target) {
            // Contact already in list — select directly
            this.selectContact(target);
            return;
          } else {
            // New match: contact not yet in list — fetch by ID from API
            this.userService.getById(withId).subscribe({
              next: (u: any) => {
                const newContact: CoachContact = {
                  id: String(u.id),
                  name: `${u.firstName || u.prenom || ''} ${u.lastName || u.nom || ''}`.trim() || 'Utilisateur Inconnu',
                  company: u.entreprise || u.startupName || u.startup || '',
                  avatar: `${(u.firstName || u.prenom || '?')[0]}${(u.lastName || u.nom || '?')[0]}`.toUpperCase(),
                };
                // Add to contacts list if not already present
                if (!this.contacts.find(c => c.id === newContact.id)) {
                  this.contacts = [newContact, ...this.contacts];
                  this.filteredContacts = [...this.contacts];
                }
                this.selectContact(newContact);
              },
              error: () => {
                // Fallback: show first contact if fetch fails
                if (this.filteredContacts.length) this.selectContact(this.filteredContacts[0]);
              }
            });
            return;
          }
        }
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
    this.filteredContacts = this.contacts.filter((c) =>
      c.name.toLowerCase().includes(term) || (c.company || '').toLowerCase().includes(term)
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
      error: () => { this.messages = []; },
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || !this.selectedContact) return;

    // Send via HTTP POST instead of WebSocket to guarantee delivery even if WSS is blocked
    this.messageService.sendMessage(this.currentUserId, this.selectedContact.id, content).subscribe({
      next: (msg) => {
        // HTTP API returns the saved MessageDTO, add it to the UI
        this.messages = [...this.messages, {
          id: msg.id || String(Date.now()),
          expediteurId: msg.expediteurId,
          expediteurNom: '',
          expediteurPrenom: '',
          destinataireId: msg.destinataireId,
          contenu: msg.type === 'FILE' ? (msg.fichierNom || 'Fichier') : msg.contenu,
          type: msg.type || 'TEXT',
          lu: false,
          timestamp: new Date(msg.timestamp || msg.sentAt || Date.now()),
          sentAt: new Date(msg.timestamp || msg.sentAt || Date.now()),
          fichierUrl: msg.fichierUrl,
          fichierNom: msg.fichierNom,
        }];
      },
      error: (err) => {
        console.error('Failed to send message via HTTP', err);
        // Fallback: add locally anyway
        this.messages = [...this.messages, {
          id: String(Date.now()),
          expediteurId: this.currentUserId,
          expediteurNom: '',
          expediteurPrenom: '',
          destinataireId: this.selectedContact!.id,
          contenu: content,
          type: 'TEXT',
          lu: false,
          timestamp: new Date(),
        }];
      }
    });
    
    this.newMessage = '';
  }

  formatTime(date: Date | string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  ngAfterViewChecked(): void {
    try {
      if (this.scrollContainer) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (_) {}
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }
}
