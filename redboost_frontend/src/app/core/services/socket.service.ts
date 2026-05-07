import { Injectable, OnDestroy } from '@angular/core';
import { Client, IFrame, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface ChatMessage {
    id?: string;
    expediteurId: string;
    destinataireId: string;
    contenu: string;
    timestamp?: Date;
    lu?: boolean;
    type?: string;          // TEXT | FILE | CALL
    fichierUrl?: string;
    fichierNom?: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
    private client: Client | null = null;
    private subscription: StompSubscription | null = null;

    private messageReceived = new Subject<ChatMessage>();
    messageReceived$: Observable<ChatMessage> = this.messageReceived.asObservable();

    private notificationReceived = new Subject<any>();
    notificationReceived$: Observable<any> = this.notificationReceived.asObservable();
    
    private readReceiptReceived = new Subject<any>();
    readReceiptReceived$: Observable<any> = this.readReceiptReceived.asObservable();

    public callSignal$ = new Subject<any>();

    connect(token: string): void {
        if (this.client?.active) return;

        // Use SockJS with apiUrl to respect the context path (e.g. /api)
        const wsUrl = environment.apiUrl.replace('/api', '') + '/ws';

        let stompErrorCount = 0;
        const MAX_STOMP_ERRORS = 3;

        this.client = new Client({
            webSocketFactory: () => new SockJS(wsUrl, null, {
                transports: ['websocket', 'xhr-streaming', 'xhr-polling']
            }),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 30000,  // 30s between reconnect attempts
            onConnect: (_frame: IFrame) => {
                stompErrorCount = 0;  // reset on successful connection
                this.subscription = this.client!.subscribe(
                    '/user/queue/messages',
                    frame => {
                        const msg: ChatMessage = JSON.parse(frame.body);
                        this.messageReceived.next(msg);
                    },
                );

                // Subscribe to notifications channel
                this.client!.subscribe('/user/queue/notifications', frame => {
                    const notif = JSON.parse(frame.body);
                    this.notificationReceived.next(notif);
                });

                // Subscribe to read receipts
                this.client!.subscribe('/user/queue/read-receipts', frame => {
                    const receipt = JSON.parse(frame.body);
                    this.readReceiptReceived.next(receipt);
                });

                this.client!.subscribe('/user/queue/call-offer', f => {
                    this.callSignal$.next({ ...JSON.parse(f.body), type: 'offer' });
                });
                this.client!.subscribe('/user/queue/call-answer', f => {
                    this.callSignal$.next({ ...JSON.parse(f.body), type: 'answer' });
                });
                this.client!.subscribe('/user/queue/call-ice', f => {
                    this.callSignal$.next({ ...JSON.parse(f.body), type: 'ice' });
                });
                this.client!.subscribe('/user/queue/call-hangup', f => {
                    this.callSignal$.next({ ...JSON.parse(f.body), type: 'hangup' });
                });
            },
            onDisconnect: () => {
                // Silently handle disconnect — HTTP fallback remains active
                console.info('[SocketService] WebSocket disconnected. HTTP fallback is active.');
            },
            onStompError: frame => {
                stompErrorCount++;
                const msg = frame.headers['message'] || 'unknown';
                console.warn(`[SocketService] STOMP error (${stompErrorCount}/${MAX_STOMP_ERRORS}):`, msg);
                // Stop reconnecting after too many consecutive auth errors
                if (stompErrorCount >= MAX_STOMP_ERRORS) {
                    console.warn('[SocketService] Max STOMP errors reached — stopping reconnect. Check your JWT token.');
                    this.client?.deactivate();
                }
            },
            onWebSocketError: (_event) => {
                console.warn('[SocketService] WebSocket error — falling back to HTTP polling for message delivery.');
            },
        });

        this.client.activate();
    }


    sendMessage(message: ChatMessage): void {
        if (!this.client?.active) return;
        this.client.publish({
            destination: '/app/chat.send',
            body: JSON.stringify(message),
        });
    }

    sendCallSignal(destination: string, body: object): void {
        if (!this.client?.active) return;
        this.client.publish({
            destination,
            body: JSON.stringify(body),
        });
    }

    disconnect(): void {
        this.subscription?.unsubscribe();
        this.client?.deactivate();
        this.client = null;
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}
