import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

type CollabEvent =
  | 'task.created'
  | 'task.updated'
  | 'note.created'
  | 'note.updated'
  | 'project.updated';

// Web Sockets for Notification Purpose Only
@WebSocketGateway({ cors: true })
export class CollabGateway {
  @WebSocketServer()
  server!: Server;

  emitTaskEvent<T extends Record<string, any> = Record<string, any>>(
    type: CollabEvent,
    payload: T,
  ): void {
    this.server.emit(type, payload);
  }
}
