'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Bell } from 'lucide-react'
import { useUser } from '@/lib/auth/useUser'
import { getMyNotifications, markMyNotificationsRead } from '../actions'
import { formatDay } from './reservationLabels'

export function NotificationsBell() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)

  const { data: notifications, mutate } = useSWR(
    user ? ['my-notifications', user.id] : null,
    getMyNotifications,
    { revalidateOnFocus: false },
  )

  if (!user) return null

  const unread = notifications?.filter((n) => !n.readAt) ?? []

  const toggle = async () => {
    const opening = !open
    setOpen(opening)
    if (opening && unread.length > 0) {
      await markMyNotificationsRead()
      void mutate()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Avisos${unread.length ? `: ${unread.length} sin leer` : ''}`}
        className="relative rounded p-2 hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-card p-2 shadow-lg">
          {notifications && notifications.length > 0 ? (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="rounded p-2 text-sm hover:bg-muted">
                  <p className="whitespace-pre-line">{n.message}</p>
                  <span className="text-xs text-muted-foreground">{formatDay(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">No tienes avisos</p>
          )}
        </div>
      )}
    </div>
  )
}
