import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log(`⚡ [Socket.io] Client connected: ${socket.id}`);

        socket.on('JOIN_EVENT_ROOM', (functionId) => {
            if (functionId) {
                socket.join(functionId);
                console.log(`📡 Client ${socket.id} joined event room: ${functionId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        console.warn('⚠️ Socket.io instance not initialized yet');
    }
    return io;
};

export const broadcastToRoom = (functionId, eventName, payload) => {
    if (io) {
        if (functionId) {
            io.to(functionId).emit(eventName, payload);
            // Also broadcast to general room so all active dashboard tabs get real-time updates
            io.emit(eventName, payload);
        } else {
            io.emit(eventName, payload);
        }
        console.log(`📡 [Socket Broadcast] Emitted event '${eventName}' to room '${functionId || 'global'}'`);
    }
};
