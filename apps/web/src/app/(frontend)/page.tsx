"use client";

import { ReservationsTable } from '@/modules/catalog/ui/ReservationsTable'
import CalendarView from '@/components/legacy/CalendarView'
import { signIn, useSession } from '@/lib/auth/client';
import React from 'react';
import { Button } from '@/components/legacy/button';

export default function Home() {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <div className="container flex flex-col gap-8">
      {user ? (<React.Fragment>
        <CalendarView calendarEmail="pafe.gcalendar@gmail.com" />
        <ReservationsTable />
      </React.Fragment>
      ) : (
        <React.Fragment>
          <h1 className="text-2xl font-bold">Bienvenido a PAFE</h1>
          <Button className='max-w-xs' onClick={async () => await signIn.social({ provider: 'google', callbackURL: '/' })}>Entrar</Button>
        </React.Fragment>
      )}
    </div>
  )
}