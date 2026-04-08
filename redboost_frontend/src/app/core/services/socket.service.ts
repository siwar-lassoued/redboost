import { Injectable, OnDestroy } from '@angular/core';
import { Client, IFrame, StompSubscription } from '@stomp/stompjs';
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

        // Determine protocol based on environment – derive WS URL from apiUrl
        const url = new URL(environment.apiUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const brokerURL = `${protocol}//${url.host}/ws`;

        this.client = new Client({
            brokerURL,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: (_frame: IFrame) => {
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
            onStompError: frame => {
                console.error('STOMP error:', frame.headers['message']);
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
