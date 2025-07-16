"use client";

import { ReservationsTable } from '@/modules/catalog/ui/ReservationsTable'
import CalendarView from '@/components/CalendarView'
import { usePayloadSession } from 'payload-authjs/client';
import React from 'react';
import { Button } from 'tamagui';
import { signInAction } from '@/payload/plugins/authjs/signIn';

export default function Home() {
    const { session } = usePayloadSession()
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
          <Button className='max-w-xs' onPress={async () => await signInAction()}>Entrar</Button>
        </React.Fragment>
      )}
    </div>
  )
}