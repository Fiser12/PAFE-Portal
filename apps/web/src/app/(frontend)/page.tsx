"use client";

import { ReservationsTable } from '@/modules/catalog/ui/ReservationsTable'
import { AgendaCargada } from '@/modules/calendario/ui/AgendaCargada'
import { useUser } from '@/lib/auth/useUser';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { useTextos } from '@/components/IdiomaProvider'

export default function Home() {
  const t = useTextos()
  const { user } = useUser()

  return (
    <div className="container flex flex-col gap-8 py-8">
      {user ? (<React.Fragment>
        <AgendaCargada />
        <ReservationsTable />
      </React.Fragment>
      ) : (
        <React.Fragment>
          <h1 className="text-2xl font-semibold">{t.inicioBienvenida}</h1>
          <Button className='max-w-xs' asChild>
            <Link href="/login">{t.entrar}</Link>
          </Button>
        </React.Fragment>
      )}
    </div>
  )
}
