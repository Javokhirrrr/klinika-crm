// src/hooks/useSocket.js
// Real-time Socket.IO hook — barcha sahifalar shu orqali yangilanadi
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://klinika-crm-eng-yangi-production.up.railway.app';

// Bitta global socket instance (hot-reload da duplicate bog'lanishni oldini olish)
let _globalSocket = null;
let _orgId = null;

function getSocket(orgId) {
    if (_globalSocket && _globalSocket.connected && _orgId === orgId) {
        return _globalSocket;
    }
    // Avvalgisini yop
    if (_globalSocket) {
        _globalSocket.disconnect();
        _globalSocket = null;
    }
    _orgId = orgId;
    _globalSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        auth: {
            token: localStorage.getItem('accessToken') || '',
        },
    });
    return _globalSocket;
}

/**
 * useSocket — Socket.IO hook
 *
 * @param {string} orgId - tashkilot ID
 * @param {Object} handlers - voqea handlerlari
 *   handlers['appointment:status-changed'] = (data) => void
 *   handlers['queue:updated'] = (data) => void
 *   handlers['queue:new-patient'] = (data) => void
 *   handlers['queue:patient-called'] = (data) => void
 *   handlers['queue:status-changed'] = (data) => void
 */
export function useSocket(orgId, handlers = {}) {
    const socketRef = useRef(null);
    const handlersRef = useRef(handlers);

    // Handlersni ref ga saqlash (stale closure muammo oldini olish)
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        if (!orgId) return;

        const socket = getSocket(orgId);
        socketRef.current = socket;

        // Orgga qo'shilish
        const joinOrg = () => {
            socket.emit('join:org', orgId);
            console.log('🔌 Socket joined org:', orgId);
        };

        if (socket.connected) {
            joinOrg();
        }

        socket.on('connect', joinOrg);
        socket.on('disconnect', (reason) => {
            console.warn('🔌 Socket disconnected:', reason);
        });

        // Voqealarni tinglash
        const eventNames = Object.keys(handlersRef.current);
        const listeners = {};
        eventNames.forEach((event) => {
            listeners[event] = (data) => {
                const handler = handlersRef.current[event];
                if (typeof handler === 'function') handler(data);
            };
            socket.on(event, listeners[event]);
        });

        return () => {
            socket.off('connect', joinOrg);
            eventNames.forEach((event) => {
                if (listeners[event]) socket.off(event, listeners[event]);
            });
        };
    }, [orgId]);

    const emit = useCallback((event, data) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit(event, data);
        }
    }, []);

    return { socket: socketRef.current, emit };
}

export default useSocket;
