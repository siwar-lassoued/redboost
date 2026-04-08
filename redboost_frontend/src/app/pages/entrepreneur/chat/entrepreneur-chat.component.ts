import { Component, ChangeDetectionStrategy, signal, computed, ViewChild, ElementRef, AfterViewChecked, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, Message } from '../../../core/services/message.service';
import { SocketService, ChatMessage } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { ChatFileUploadComponent } from '../../../shared/components/chat-file-upload/chat-file-upload.component';
import { ActivatedRoute } from '@angular/router';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
}

interface ChatMessageDisplay {
  id: number | string;
  sender: 'coach' | 'entrepreneur';
  content: string;
  time: string;
    date: string;
    type?: string;          // TEXT | FILE
    fichierUrl?: string;
    fichierNom?: string;
    lu?: boolean;
}

@Component({
  selector: 'app-entrepreneur-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ChatFileUploadComponent],
  template: `
    <div class="h-[calc(100vh-140px)]">
      <!-- Desktop header -->
      <div class="hidden lg:block mb-6">
        <h1 style="font-size: 28px; font-weight: 800; color: #000; margin: 0;">Chat Coach</h1>
        <p style="color: #8a8a8a; font-size: 14px; margin-top: 4px;">Communiquez avec votre coach référent</p>
      </div>

      <!-- Main Chat Container -->
      <div 
        class="bg-white rounded-2xl overflow-hidden flex flex-col lg:flex-row h-full lg:h-[calc(100%-80px)]"
        style="box-shadow: 0 4px 20px rgba(0,0,0,0.08);"
      >
        <!-- Sidebar (Conversations List) -->
        <div 
          class="flex flex-col bg-white border-r border-gray-100 flex-shrink-0"
          [class.hidden]="isMobileView() && mobileView() === 'chat'"
          [class.w-full]="isMobileView()"
          [class.w-72]="!isMobileView()"
          [class.h-full]="isMobileView()"
        >
          <!-- Search -->
          <div class="p-4 border-b border-gray-100">
            @if (isMobileView()) {
              <div class="mb-3">
                <h1 class="text-lg font-bold text-[#1A1A2E]">Chat Coach</h1>
                <p class="text-gray-500 text-xs mt-0.5">Communiquez avec votre coach</p>
              </div>
            }
            <div class="relative">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                [(ngModel)]="searchTerm"
                class="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ff3d91]/20 text-gray-700"
                placeholder="Rechercher..."
              >
            </div>
          </div>

          <!-- List -->
          <div class="overflow-y-auto flex-1 custom-scrollbar">
            @if (isLoadingConversations()) {
              <div class="p-4 text-center text-gray-500">
                <div class="animate-spin w-6 h-6 border-2 border-[#ff3d91] border-t-transparent rounded-full mx-auto mb-2"></div>
                Chargement...
              </div>
            } @else if (filteredConversations().length === 0) {
              <div class="p-4 text-center text-gray-500">
                Aucun coach assigné
              </div>
            } @else {
              @for (conv of filteredConversations(); track conv.id) {
                <button
                  (click)="selectConversation(conv)"
                  class="w-full flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left"
                  [class.bg-[#FFF0F2]]="selected()?.id === conv.id && !isMobileView()"
                >
                  <div class="relative flex-shrink-0">
                    <div
                      class="w-11 h-11 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                      style="background: linear-gradient(135deg, #ff3d91, #a17dfd);"
                    >
                      {{ conv.avatar }}
                    </div>
                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-[#1A1A2E] truncate">{{ conv.name }}</p>
                    <p class="text-xs text-gray-400 truncate">Coach Expert</p>
                  </div>
                  @if (isMobileView()) {
                    <div class="text-xs text-gray-300">›</div>
                  }
                </button>
              }
            }
          </div>
        </div>

        <!-- Chat Zone -->
        <div 
          class="flex-1 flex flex-col bg-white min-w-0 h-full"
          [class.hidden]="isMobileView() && mobileView() === 'list'"
        >
          @if (selected()) {
            <!-- Header -->
            <div class="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-white">
              @if (isMobileView()) {
                <button
                  (click)="mobileView.set('list')"
                  class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors mr-1 flex-shrink-0"
                >
                  <i class="pi pi-arrow-left text-gray-600"></i>
                </button>
              }
              
              <div class="relative flex-shrink-0">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                  style="background: linear-gradient(135deg, #ff3d91, #a17dfd);"
                >
                  {{ selected()?.avatar }}
                </div>
                <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-[#1A1A2E] text-sm truncate">{{ selected()?.name }}</p>
                <p class="text-xs text-gray-400 truncate">
                  Coach · <span class="text-green-500 font-medium">En ligne</span>
                </p>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
                  <i class="pi pi-ellipsis-v"></i>
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40 custom-scrollbar" #scrollContainer>
              @if (isLoadingMessages()) {
                <div class="text-center text-gray-500 py-8">
                  <div class="animate-spin w-6 h-6 border-2 border-[#ff3d91] border-t-transparent rounded-full mx-auto mb-2"></div>
                  Chargement des messages...
                </div>
              } @else if (messages().length === 0) {
                <div class="text-center text-gray-500 py-8">
                  Aucun message. Commencez la conversation!
                </div>
              } @else {
                @for (msg of messages(); track msg.id) {
                  <div class="flex" [class.justify-end]="msg.sender === 'entrepreneur'" [class.justify-start]="msg.sender !== 'entrepreneur'">
                    @if (msg.sender !== 'entrepreneur') {
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 self-end shadow-sm"
                        style="background: linear-gradient(135deg, #ff3d91, #a17dfd);"
                      >
                        {{ selected()?.avatar }}
                      </div>
                    }
                    <div
                      class="max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 text-sm leading-relaxed shadow-sm flex flex-col"
                      [class]="msg.sender === 'entrepreneur' ? 'rounded-2xl rounded-tr-sm text-white' : 'rounded-2xl rounded-tl-sm bg-white text-gray-800'"
                      [style.background]="msg.sender === 'entrepreneur' ? 'linear-gradient(135deg, #ff3d91, #a17dfd)' : ''"
                    >
                      @if (msg.type === 'FILE') {
                        <div class="flex items-center gap-2 bg-black/10 p-2 rounded-lg mb-1">
                          <i class="pi pi-file"></i>
                          <a [href]="msg.fichierUrl" target="_blank" class="truncate font-medium underline max-w-[150px] inline-block" [style.color]="msg.sender === 'entrepreneur' ? 'white' : 'inherit'">
                            {{ msg.fichierNom || 'Fichier joint' }}
                          </a>
                        </div>
                      } @else {
                        <span class="break-words">{{ msg.content }}</span>
                      }
                      
                      <div
                        class="text-[10px] mt-1 font-medium flex items-center gap-1"
                        [class]="msg.sender === 'entrepreneur' ? 'text-white/80 justify-end' : 'text-gray-400'"
                      >
                        {{ msg.time }}
                        @if (msg.sender === 'entrepreneur') {
                           <i class="pi pi-{{msg.lu ? 'check-circle' : 'check'}} text-[10px]" [style.color]="msg.lu ? '#4ade80' : 'white'"></i>
                        }
                      </div>
                    </div>
                  </div>
                }
              }
            </div>

            <!-- Input -->
            <div class="p-3 border-t border-gray-100 flex items-center gap-2.5 bg-white relative">
              <app-chat-file-upload
                [senderId]="currentUserId!"
                [recipientId]="selected()!.id"
                (fileSent)="onFileSent($event)"
                (uploadError)="onUploadError($event)">
              </app-chat-file-upload>

              <input
                [(ngModel)]="newMessage"
                (keydown.enter)="sendMessage()"
                class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff3d91]/20 focus:border-[#ff3d91] transition-colors"
                placeholder="Écrivez un message..."
              >
              <button
                (click)="sendMessage()"
                [disabled]="!newMessage().trim()"
                class="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#ff3d91]/20"
                style="background: linear-gradient(135deg, #ff3d91, #a17dfd);"
              >
                <i class="pi pi-send ml-0.5"></i>
              </button>
            </div>
          } @else {
            <div class="flex-1 flex items-center justify-center text-gray-500">
              <div class="text-center">
                <i class="pi pi-comments text-5xl text-gray-200 mb-4 block"></i>
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 10px; }
    @media (max-width: 1024px) {
      .h-\\[calc\\(100vh-140px\\)\\] { height: calc(100vh - 80px); }
    }
  `]
})
export class EntrepreneurChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  private messageService = inject(MessageService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);

  conversations = signal<Conversation[]>([]);
  messages = signal<ChatMessageDisplay[]>([]);
  selected = signal<Conversation | null>(null);
  searchTerm = signal('');
  newMessage = signal('');
  mobileView = signal<'list' | 'chat'>('list');
  isLoadingConversations = signal(false);
  isLoadingMessages = signal(false);

  isMobileView = signal(window.innerWidth < 1024);
  public currentUserId: string | undefined;

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobileView.set(window.innerWidth < 1024);
    });
  }

  ngOnInit(): void {
    // We expect the auth service to maintain currentUser state directly
    const user = this.authService.currentUser$.value;
    this.currentUserId = user?.id?.toString();
    this.loadCoach();
    this.connectWebSocket();
    
    // Handle dynamic "with" query param changes
    this.route.queryParamMap.subscribe(params => {
      const withId = params.get('with');
      if (withId) {
        this.checkQueryParam(withId);
      }
    });

    // Handle incoming read receipts
    this.socketService.readReceiptReceived$.subscribe(receipt => {
      if (this.selected()?.id === receipt.readerId) {
        this.messages.update(msgs => msgs.map(m => {
          if (m.sender === 'entrepreneur') {
            return { ...m, lu: true };
          }
          return m;
        }));
      }
    });
  }

  private loadCoach(): void {
    this.isLoadingConversations.set(true);
    if (!this.currentUserId) return;

    // Load the assigned coach(es) for this entrepreneur
    this.userService.getCoachesByEntrepreneur(this.currentUserId).subscribe({
      next: (users) => {
        const convs: Conversation[] = users.map(u => ({
          id: u.id,
          name: `${u.prenom} ${u.nom}`,
          avatar: `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase()
        }));
        this.conversations.set(convs);
        this.isLoadingConversations.set(false);
        const withId = this.route.snapshot.queryParamMap.get('with');
        if (withId) {
          this.checkQueryParam(withId);
        }
        // Auto-select first coach if available and no query param
        if (convs.length > 0 && !this.route.snapshot.queryParamMap.has('with')) {
          this.selectConversation(convs[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load coach:', err);
        this.isLoadingConversations.set(false);
      }
    });
  }

  private checkQueryParam(withId: string): void {
    if (withId) {
      const conv = this.conversations().find(c => c.id === withId);
      if (conv) {
        this.selectConversation(conv);
      } else if (!this.isLoadingConversations()) {
        console.warn('Conversation not found in list for ID:', withId);
      }
    }
  }

  private connectWebSocket(): void {
    const token = this.authService.getToken();
    if (token) {
      this.socketService.connect(token);
      this.socketService.messageReceived$.subscribe(msg => {
        if (this.selected() && msg.expediteurId === this.selected()?.id) {
          this.addMessageToList(msg, 'coach');
        }
      });
    }
  }

  filteredConversations = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.conversations().filter(c =>
      c.name.toLowerCase().includes(term)
    );
  });

  selectConversation(conv: Conversation): void {
    this.selected.set(conv);
    if (this.isMobileView()) {
      this.mobileView.set('chat');
    }
    this.loadMessages(conv.id);
  }

  private loadMessages(userId: string): void {
    if (!this.currentUserId) return;

    this.isLoadingMessages.set(true);
    this.messageService.getConversation(this.currentUserId, userId).subscribe({
      next: (msgs) => {
        const displayMsgs: ChatMessageDisplay[] = msgs.map(m => ({
          id: m.id,
          sender: m.expediteurId === this.currentUserId ? 'entrepreneur' : 'coach' as const,
          content: m.type === 'FILE' ? (m.fichierNom || 'Fichier') : m.contenu,
          time: new Date(m.timestamp || m.sentAt || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          date: new Date(m.timestamp || m.sentAt || Date.now()).toLocaleDateString('fr-FR'),
          lu: m.lu,
          type: m.type,
          fichierUrl: m.fichierUrl,
          fichierNom: m.fichierNom
        }));
        this.messages.set(displayMsgs);
        this.isLoadingMessages.set(false);
        this.markAsRead(); // Mark as read when conversation is opened
      },
      error: (err) => {
        console.error('Failed to load messages:', err);
        this.isLoadingMessages.set(false);
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage().trim() || !this.selected() || !this.currentUserId) return;

    const content = this.newMessage().trim();
    const timeString = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Create message for WebSocket
    const wsMessage: ChatMessage = {
      expediteurId: this.currentUserId,
      destinataireId: this.selected()!.id,
      contenu: content
    };

    // Send via WebSocket
    this.socketService.sendMessage(wsMessage);

    // Add to local list immediately
    this.messages.update(msgs => [...msgs, {
      id: Date.now(),
      sender: 'entrepreneur',
      content: content,
      time: timeString,
      date: "Aujourd'hui",
      lu: false
    }]);

    this.newMessage.set('');
  }

  private addMessageToList(msg: any, senderType: 'coach' | 'entrepreneur'): void {
    const timeString = new Date(msg.timestamp || msg.sentAt || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.messages.update(msgs => [...msgs, {
      id: msg.id || Date.now(),
      sender: senderType,
      content: msg.type === 'FILE' ? (msg.fichierNom || 'Fichier') : msg.contenu,
      time: timeString,
      date: "Aujourd'hui",
      lu: msg.lu || false,
      type: msg.type,
      fichierUrl: msg.fichierUrl,
      fichierNom: msg.fichierNom
    }]);
  }

  onFileSent(msg: any): void {
    // Treat the API response (File message DTO) as an outgoing message
    this.addMessageToList(msg, 'entrepreneur');
  }

  onUploadError(errorMsg: string): void {
    alert(errorMsg);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer && (this.mobileView() === 'chat' || !this.isMobileView())) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) { }
  }

  private markAsRead(): void {
    const coachId = this.selected()?.id;
    if (coachId && this.currentUserId) {
      this.messageService.markAsRead(this.currentUserId, coachId).subscribe();
    }
  }
}
