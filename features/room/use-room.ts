'use client';

import { useEffect, useMemo, useState } from 'react';
import { createRoomRepository } from '../../lib/persistence/repositories';
import { LOCAL_PROFILE_ID } from '../../lib/persistence/schema';
import {
  DEFAULT_ROOM_STATE,
  deriveOverallRoomStatus,
  deriveRoomCounts,
  deriveRoomView,
  ROOM_CHILDREN,
  type RoomEntityId,
  type RoomFilter,
  type RoomSession,
  type RoomStatus,
  type RoomUpdated,
  type RoomZoneId,
} from './domain';
import { prepareRoomDayReset, prepareRoomStatusChange } from './service';

type SelectedRoomEntity = { id: RoomEntityId; name: string };

const INITIAL_SESSION: RoomSession = {
  date: new Date().toLocaleDateString('en-CA'),
  state: DEFAULT_ROOM_STATE,
  updated: {},
  history: [],
  notifications: false,
};

function createId(): string {
  return globalThis.crypto.randomUUID();
}

export function useRoom() {
  const [repository] = useState(() => createRoomRepository());

  const [session, setSession] = useState<RoomSession>(INITIAL_SESSION);
  const [selected, setSelected] = useState<SelectedRoomEntity | null>(null);
  const [filter, setFilter] = useState<RoomFilter>('all');
  const [confirmReset, setConfirmReset] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      repository
        .loadSession()
        .then((storedSession) => {
          setSession(storedSession);
          setReady(true);
        })
        .catch(() => setReady(true));
    });
  }, [repository]);

  const view = useMemo(() => deriveRoomView(session.state), [session.state]);
  const counts = useMemo(() => deriveRoomCounts(session.state), [session.state]);
  const overall = useMemo(
    () => deriveOverallRoomStatus(session.state),
    [session.state],
  );

  useEffect(() => {
    if (
      !ready ||
      !session.notifications ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return;
    }

    const check = () => {
      if (overall === 'ok') return;
      const wait = overall === 'attention' ? 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
      const last = Number(
        localStorage.getItem('mi-habitacion:last-notification') || 0,
      );
      if (Date.now() - last < wait) return;
      const body =
        overall === 'attention'
          ? 'Hay una zona que requiere atención.'
          : 'Hay una zona que conviene revisar.';
      const sent = () => {
        localStorage.setItem(
          'mi-habitacion:last-notification',
          String(Date.now()),
        );
      };

      navigator.serviceWorker?.ready
        .then((registration) =>
          registration
            .showNotification('Mi habitación', {
              body,
              icon: '/app-icon.svg',
              tag: 'mi-habitacion-order',
            })
            .then(sent),
        )
        .catch(() => {
          new Notification('Mi habitación', {
            body,
            icon: '/app-icon.svg',
            tag: 'mi-habitacion-order',
          });
          sent();
        });
    };

    check();
    const timer = window.setInterval(check, 60 * 1000);
    return () => window.clearInterval(timer);
  }, [ready, session.notifications, overall]);

  const setStatus = (status: RoomStatus) => {
    if (!selected) return;
    const mutation = prepareRoomStatusChange(
      LOCAL_PROFILE_ID,
      session,
      selected.id,
      status,
      Date.now(),
      createId,
    );
    setSession(mutation.session);
    setSelected(null);
    void repository.commit(mutation).catch(() => {});
  };

  const resetDay = () => {
    const mutation = prepareRoomDayReset(
      LOCAL_PROFILE_ID,
      session,
      Date.now(),
      createId,
    );
    setSession(mutation.session);
    setConfirmReset(false);
    void repository.commit(mutation).catch(() => {});
  };

  const toggleNotifications = async () => {
    if (session.notifications) {
      setSession((current) => ({ ...current, notifications: false }));
      await repository.saveNotificationPreference(false);
      return;
    }
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setSession((current) => ({ ...current, notifications: true }));
      await repository.saveNotificationPreference(true);
    }
  };

  const currentSelected = selected
    ? ROOM_CHILDREN[selected.id as RoomZoneId]
      ? view[selected.id as RoomZoneId]
      : session.state[selected.id]
    : 'ok';

  const visible = (status: RoomStatus) => filter === 'all' || status === filter;

  return {
    state: session.state,
    updated: session.updated as RoomUpdated,
    notifications: session.notifications,
    selected,
    filter,
    confirmReset,
    view,
    counts,
    overall,
    currentSelected,
    visible,
    setSelected,
    setFilter,
    setConfirmReset,
    setStatus,
    resetDay,
    toggleNotifications,
  };
}
