import { FC } from 'react'

interface CalendarViewProps {
    calendarEmail?: string
    height?: number
}

const CalendarView: FC<CalendarViewProps> = ({
    calendarEmail = 'pafe.gcalendar@gmail.com',
    height = 400
}) => {
    const baseUrl = 'https://calendar.google.com/calendar/embed'
    const commonParams = {
        height: '600',
        wkst: '2',
        ctz: 'Europe/Madrid',
        showPrint: '0',
        showTitle: '0',
        showTz: '0',
        showCalendars: '0',
        src: calendarEmail
    }

    const weekViewUrl = `${baseUrl}?${new URLSearchParams({
        ...commonParams,
        mode: 'WEEK'
    }).toString()}`

    const agendaViewUrl = `${baseUrl}?${new URLSearchParams({
        ...commonParams,
        mode: 'AGENDA'
    }).toString()}`

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-4/6">
                <iframe
                    src={weekViewUrl}
                    style={{ 
                        width: '100%', 
                        height: `${height}px`,
                        borderRadius: '12px'
                    }}
                    frameBorder="0"
                />
            </div>
            <div className="w-full md:w-2/6">
                <iframe
                    src={agendaViewUrl}
                    style={{ 
                        width: '100%', 
                        height: `${height}px`,
                        borderRadius: '12px'
                    }}
                    frameBorder="0"
                />
            </div>
        </div>
    )
}

export default CalendarView
