export const LATE_RETURN_MESSAGE =
  'En caso de devolución tardía, tened en cuenta que esto puede afectar a otras personas del equipo que deseen hacer uso del mismo.'

export const LOSS_MESSAGE =
  'Por otro lado, en caso de ruptura o pérdida, deberá comprar uno similar y entregarlo a PAFE antes de un mes.'

export const toSpanishDate = (iso: string): string => iso.split('-').reverse().join('-')

export const reminderEmail = ({ title, dueISO }: { title: string; dueISO: string }) => {
  const eu = `Gogoratu nahi dizugu ${dueISO}an itzuli behar duzula ${title}`
  const es = `Deseamos recordarle que tiene que devolver ${title} el ${toSpanishDate(dueISO)}`
  return {
    subject: `PAFE — ${title}`,
    eu,
    es,
    text: `${eu}\n\n${es}`,
    html: `<p>${eu}</p><p>${es}</p>`,
  }
}

export const lateReturnEmail = ({ title }: { title: string }) => ({
  subject: `PAFE — devolución de ${title}`,
  text: LATE_RETURN_MESSAGE,
  html: `<p>${LATE_RETURN_MESSAGE}</p>`,
})

export const lossEmail = ({ title }: { title: string }) => ({
  subject: `PAFE — reposición de ${title}`,
  text: LOSS_MESSAGE,
  html: `<p>${LOSS_MESSAGE}</p>`,
})
