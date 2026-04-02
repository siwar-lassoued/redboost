import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
          <!-- Contacts Sidebar -->
          <div class="contacts-panel">
              <div class="search-contacts">
                  <i class="pi pi-search"></i>
                  <input type="text" placeholder="Rechercher..." [(ngModel)]="searchTerm" />
              </div>

              <div class="contacts-list">
                  <div class="contact-item" [class.active]="selectedContact === 0" (click)="selectedContact = 0">
                      <div class="avatar-sm purple-avatar">RZ</div>
                      <div class="contact-info">
                          <div class="contact-name">Rania Zouari</div>
                          <div class="contact-sub">PayLoop</div>
                      </div>
                      <div class="online-dot"></div>
                  </div>
                  <div class="contact-item" [class.active]="selectedContact === 1" (click)="selectedContact = 1">
                      <div class="avatar-sm pink-avatar">FA</div>
                      <div class="contact-info">
                          <div class="contact-name">Fatma Ben Amor</div>
                          <div class="contact-sub">GreenBox</div>
                      </div>
                      <div class="online-dot"></div>
                  </div>
              </div>
          </div>

          <!-- Chat Area -->
          <div class="chat-area">
              <!-- Chat Header -->
              <div class="chat-header">
                  <div class="flex items-center gap-3">
                      <div class="avatar-sm purple-avatar">RZ</div>
                      <div>
                          <div class="chat-contact-name">Rania Zouari</div>
                          <div class="chat-contact-status">PayLoop · <span class="text-green-500">En ligne</span></div>
                      </div>
                  </div>
                  <button class="btn-icon"><i class="pi pi-ellipsis-v"></i></button>
              </div>

              <!-- Messages -->
              <div class="messages-area">
                  <div class="message received">
                      <div class="avatar-xs purple-avatar">RZ</div>
                      <div class="message-bubble received-bubble">
                          <p>Merci beaucoup ! À demain pour notre session à 10h 🙏</p>
                          <span class="msg-time">09:35</span>
                      </div>
                  </div>

                  <div class="message sent">
                      <div class="message-bubble sent-bubble">
                          <p>À demain ! Préparez aussi les questions investisseurs.</p>
                          <span class="msg-time">09:40</span>
                      </div>
                  </div>

                  <div class="message received">
                      <div class="avatar-xs purple-avatar">RZ</div>
                      <div class="message-bubble received-bubble">
                          <p>Super, je note. Bonne journée !</p>
                          <span class="msg-time">09:41</span>
                      </div>
                  </div>
              </div>

              <!-- Input Bar -->
              <div class="chat-input-bar">
                  <input type="text" placeholder="Écrivez un message..." [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" />
                  <button class="send-btn" (click)="sendMessage()">
                      <i class="pi pi-send"></i>
                  </button>
              </div>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
        padding: 2rem;
        background: #f8f9fa;
        min-height: calc(100vh - 70px);
        font-family: var(--font-family);
        margin-top: -1rem;
    }
    .page-header h1 { font-size: 2.2rem; font-weight: 700; color: #2D3748; margin: 0; }
    .page-header p { color: #718096; font-size: 1.1rem; margin-top: 0.3rem; margin-bottom: 1.5rem; }

    .chat-container {
        display: flex;
        background: white;
        border-radius: 1.5rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        overflow: hidden;
        height: calc(100vh - 200px);
        min-height: 500px;
    }

    /* Contacts Panel */
    .contacts-panel {
        width: 320px;
        border-right: 1px solid #EDF2F7;
        display: flex;
        flex-direction: column;
    }
    .search-contacts {
        position: relative;
        padding: 1.2rem;
        border-bottom: 1px solid #EDF2F7;
    }
    .search-contacts input {
        width: 100%;
        padding: 0.7rem 1rem 0.7rem 2.5rem;
        border-radius: 10px;
        border: 1px solid #E2E8F0;
        background: #F8FAFC;
        font-family: inherit;
        font-size: 0.9rem;
        outline: none;
        transition: all 0.2s;
    }
    .search-contacts input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .search-contacts i { position: absolute; left: 2rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }

    .contacts-list { flex: 1; overflow-y: auto; }
    .contact-item {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 1rem 1.2rem;
        cursor: pointer;
        transition: background 0.2s;
        position: relative;
    }
    .contact-item:hover { background: #F8FAFC; }
    .contact-item.active { background: #FFF5F7; border-left: 3px solid #FF4D85; }
    .contact-info { flex: 1; }
    .contact-name { font-weight: 600; color: #2D3748; font-size: 0.95rem; }
    .contact-sub { color: #A0AEC0; font-size: 0.8rem; }
    .online-dot { width: 10px; height: 10px; border-radius: 50%; background: #48BB78; }

    /* Chat Area */
    .chat-area { flex: 1; display: flex; flex-direction: column; }
    .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #EDF2F7;
    }
    .chat-contact-name { font-weight: 700; color: #2D3748; font-size: 1.05rem; }
    .chat-contact-status { color: #A0AEC0; font-size: 0.85rem; }

    .messages-area { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .message { display: flex; gap: 0.6rem; align-items: flex-end; }
    .message.sent { justify-content: flex-end; }
    .message-bubble { max-width: 70%; padding: 0.8rem 1.2rem; border-radius: 1rem; position: relative; }
    .received-bubble { background: #F7FAFC; color: #2D3748; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .sent-bubble { background: linear-gradient(135deg, #FF6B9E, #C850C0); color: white; border-bottom-right-radius: 4px; }
    .message-bubble p { margin: 0; font-size: 0.95rem; line-height: 1.5; }
    .msg-time { font-size: 0.7rem; opacity: 0.7; display: block; text-align: right; margin-top: 0.3rem; }

    .chat-input-bar {
        display: flex;
        gap: 0.8rem;
        padding: 1rem 1.5rem;
        border-top: 1px solid #EDF2F7;
        background: #FAFBFC;
    }
    .chat-input-bar input {
        flex: 1;
        padding: 0.8rem 1.2rem;
        border-radius: 25px;
        border: 1px solid #E2E8F0;
        background: white;
        font-family: inherit;
        font-size: 0.95rem;
        outline: none;
        transition: all 0.2s;
    }
    .chat-input-bar input:focus { border-color: #FF4D85; box-shadow: 0 0 0 3px rgba(255,77,133,0.1); }
    .send-btn {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FF6B9E, #C850C0);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 15px rgba(233,30,99,0.3);
    }
    .send-btn:hover { transform: scale(1.05); }

    .avatar-sm { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.85rem; flex-shrink: 0; }
    .avatar-xs { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 0.65rem; flex-shrink: 0; }
    .pink-avatar { background: linear-gradient(135deg, #FF6B9E, #FF3366); }
    .purple-avatar { background: linear-gradient(135deg, #B794F4, #805AD5); }

    .btn-icon { background: none; border: none; color: #A0AEC0; cursor: pointer; padding: 0.5rem; }
    .btn-icon:hover { color: #2D3748; }
  `]
})
export class CoachChatComponent implements OnInit {
  selectedContact: number = 0;
  searchTerm: string = '';
  newMessage: string = '';

  constructor() {}
  ngOnInit(): void {}

  sendMessage() {
    if (this.newMessage.trim()) {
      // In a real implementation, send via WebSocket/HTTP
      this.newMessage = '';
    }
  }
}
