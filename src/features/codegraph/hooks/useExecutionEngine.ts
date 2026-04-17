import { useState, useEffect, useCallback, useRef } from 'react';

export type EngineStatus = 'OFFLINE' | 'STARTING' | 'ONLINE' | 'ERROR';

export interface EngineMetrics {
  uptime: number;
  memory: string;
  cpuLoad: string;
  cores: number;
  sessions: number;
  os: string;
}

export function useExecutionEngine() {
  const [status, setStatus] = useState<EngineStatus>('OFFLINE');
  const [latency, setLatency] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      // Connect to local engine on 8080
      const socket = new WebSocket('ws://localhost:8080/ws/engine');
      ws.current = socket;

      socket.onopen = () => {
        setStatus('ONLINE');
        console.log('Connected to local execution engine');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') {
            setLatency(Date.now() - data.timestamp);
          }
          if (data.status) {
            setStatus(data.status);
          }
          if (data.memory) {
            setMetrics({
              uptime: data.uptime,
              memory: data.memory,
              cpuLoad: data.cpuLoad,
              cores: data.cores,
              sessions: data.sessions,
              os: data.os
            });
          }
        } catch (e) {
          console.warn('Failed to parse engine message', e);
        }
      };

      socket.onclose = () => {
        setStatus('OFFLINE');
        setLatency(null);
        // Attempt reconnect after 5 seconds
        reconnectTimeout.current = setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        setStatus('ERROR');
        socket.close();
      };

    } catch (err) {
      setStatus('OFFLINE');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  const toggleEngine = useCallback((command: 'START' | 'STOP') => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'COMMAND', command }));
    } else if (command === 'START') {
      // If offline, we can't really send a WS command to start it, 
      // usually this would be handled by a sidecar or the binary itself.
      // But for the UI, we'll simulate the attempt.
      setStatus('STARTING');
      setTimeout(() => { if (status === 'STARTING') setStatus('OFFLINE'); }, 10000);
    }
  }, [status]);

  return { status, latency, metrics, toggleEngine };
}
