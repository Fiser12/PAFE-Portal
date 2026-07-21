import type { FC } from 'react'

interface CalendarViewProps {
  height?: number
}

const CALENDAR_SOURCES = [
  'd20c77c2f7d9a30e05ba35ba2b8e1c0d2bad4693f316eec41c2968631ae4a0c2@group.calendar.google.com',
  'pafe.gcalendar@gmail.com',
  'ed39c3b5c9029116c740f6269c6f7334e9a2a7677ab87ec43df3cc7c18f738eb@group.calendar.google.com',
  'c09323ca735f6afc403fcb43777628bb85eb708ca3d92519fe816ca5bd6d5fd8@group.calendar.google.com',
  '0800731e87911cc999e31d592ce0d8445ee9eb98d271ae9de4ea339da274b48b@group.calendar.google.com',
  'a0b86075ef106273714e76991530e741da071e8bc7193b8ed7e230f20c30b5dc@group.calendar.google.com',
  'a03d9c2e6d8eb945c5db3dc345800c13d089c0d2b705b219418d85ca4fce4608@group.calendar.google.com',
  'a7aa49d30599079ac9d9836940353477761822b5913ee7a3f0f8a2054a359cda@group.calendar.google.com',
]

const CALENDAR_COLORS = [
  '#ad1457',
  '#039be5',
  '#7986cb',
  '#9e69af',
  '#c0ca33',
  '#8e24aa',
  '#795548',
  '#a79b8e',
]

const buildCalendarUrl = (mode: 'AGENDA' | 'WEEK') => {
  const params = new URLSearchParams({
    height: '600',
    wkst: '2',
    ctz: 'Europe/Madrid',
    mode,
    showPrint: '0',
    showTitle: '0',
    showTz: '0',
    showCalendars: '0',
  })

  for (const source of CALENDAR_SOURCES) params.append('src', source)
  for (const color of CALENDAR_COLORS) params.append('color', color)

  return `https://calendar.google.com/calendar/embed?${params.toString()}`
}

const CalendarView: FC<CalendarViewProps> = ({ height = 400 }) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <div className="w-full md:w-2/3">
        <iframe
          src={buildCalendarUrl('WEEK')}
          title="Calendario semanal"
          style={{ width: '100%', height: `${height}px`, borderRadius: '12px' }}
          frameBorder="0"
        />
      </div>
      <div className="w-full md:w-1/3">
        <iframe
          src={buildCalendarUrl('AGENDA')}
          title="Agenda"
          style={{ width: '100%', height: `${height}px`, borderRadius: '12px' }}
          frameBorder="0"
        />
      </div>
    </div>
  )
}

export default CalendarView
