import React, { useState, useEffect } from 'react';
import { Event, apiClient } from '../services/api';
import { EventModal } from './EventModal';

interface CalendarProps {
  selectedMonth: Date;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedMonth }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEventsForMonth();
  }, [selectedMonth]);

  const fetchEventsForMonth = async () => {
    setLoading(true);
    try {
      const monthEvents = await apiClient.getEventsByMonth(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1
      );
      setEvents(monthEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (day: number): Event[] => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(
      selectedMonth.getMonth() + 1
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return events.filter(
      (event) =>
        event.start_date === dateStr ||
        (event.end_date && event.start_date <= dateStr && event.end_date >= dateStr)
    );
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const daysInMonth = getDaysInMonth(selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedMonth);
  const days = [];

  // Add empty cells for days before the month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={styles.container}>
      <h2 style={styles.monthTitle}>{monthName}</h2>

      {loading && <p style={styles.loadingMessage}>Loading events...</p>}

      <div style={styles.calendar}>
        {/* Week day headers */}
        <div style={styles.weekHeader}>
          {weekDays.map((day) => (
            <div key={day} style={styles.weekDayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={styles.daysContainer}>
          {days.map((day, index) => {
            const dayEvents = day ? getEventsForDate(day) : [];
            const isToday =
              day &&
              new Date().getFullYear() === selectedMonth.getFullYear() &&
              new Date().getMonth() === selectedMonth.getMonth() &&
              new Date().getDate() === day;

            return (
              <div
                key={index}
                style={{
                  ...styles.dayCell,
                  ...(day ? (isToday ? styles.todayCell : styles.activeCell) : styles.emptyCell)
                }}
              >
                {day && (
                  <>
                    <div style={styles.dayNumber}>{day}</div>
                    <div style={styles.eventsList}>
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          style={styles.eventItem}
                          onClick={() => handleEventClick(event)}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div style={styles.moreEvents}>+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <EventModal event={selectedEvent} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    backgroundColor: 'var(--background-color)',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  } as React.CSSProperties,
  monthTitle: {
    marginTop: 0,
    marginBottom: '24px',
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--text-primary)'
  } as React.CSSProperties,
  loadingMessage: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '32px 0'
  } as React.CSSProperties,
  calendar: {
    borderCollapse: 'collapse'
  } as React.CSSProperties,
  weekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden'
  } as React.CSSProperties,
  weekDayHeader: {
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '13px',
    color: 'var(--text-primary)',
    borderBottom: '2px solid var(--border-color)'
  } as React.CSSProperties,
  daysContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    backgroundColor: 'transparent',
    padding: '8px 0'
  } as React.CSSProperties,
  dayCell: {
    minHeight: '100px',
    padding: '8px',
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease'
  } as React.CSSProperties,
  emptyCell: {
    backgroundColor: '#f9fafb',
    cursor: 'default',
    border: '1px solid #e5e7eb'
  } as React.CSSProperties,
  activeCell: {
    cursor: 'pointer'
  } as React.CSSProperties,
  todayCell: {
    backgroundColor: '#eff6ff',
    borderColor: 'var(--primary-color)',
    borderWidth: '2px',
    fontWeight: 'bold'
  } as React.CSSProperties,
  dayNumber: {
    fontWeight: '600',
    fontSize: '13px',
    color: 'var(--text-primary)',
    marginBottom: '6px'
  } as React.CSSProperties,
  eventsList: {
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  } as React.CSSProperties,
  eventItem: {
    padding: '4px 6px',
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '11px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)'
  } as React.CSSProperties,
  moreEvents: {
    padding: '4px 6px',
    color: 'var(--text-secondary)',
    fontSize: '11px',
    fontWeight: '500'
  } as React.CSSProperties
};
