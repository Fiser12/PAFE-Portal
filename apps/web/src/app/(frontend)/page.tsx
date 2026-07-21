"use client";

import { ReservationsTable } from '@/modules/catalog/ui/ReservationsTable'
import CalendarView from '@/components/legacy/CalendarView'
import { useUser } from '@/lib/auth/useUser';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user } = useUser()

  return (
    <div className="container flex flex-col gap-8 py-8">
      {user ? (<React.Fragment>
        <section>
          <h2 className="mb-4 text-2xl font-semibold sm:text-3xl">Calendario</h2>
          <CalendarView />
        </section>
        <ReservationsTable />
      </React.Fragment>
      ) : (
        <React.Fragment>
          <h1 className="text-2xl font-bold">Bienvenido a PAFE</h1>
          <Button className='max-w-xs' asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        </React.Fragment>
      )}
    </div>
  )
}
