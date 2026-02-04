import React from 'react';

interface HeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentMonth, onPrevMonth, onNextMonth, onToday }) => {
  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>🎮 Game Event Calendar</h1>
          <p style={styles.subtitle}>YouTube 채널에서 게임 이벤트 자동 추출</p>
        </div>

        <div style={styles.controlsSection}>
          <div style={styles.monthDisplay}>{monthName}</div>
          <div style={styles.controls}>
            <button onClick={onPrevMonth} style={styles.navButton} title="이전 달">
              ← Previous
            </button>
            <button onClick={onToday} style={styles.todayButton} title="오늘">
              Today
            </button>
            <button onClick={onNextMonth} style={styles.navButton} title="다음 달">
              Next →
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    color: '#ffffff',
    padding: '24px 0',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '40px'
  },
  titleSection: {
    flex: 1
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.9,
    fontWeight: '400'
  },
  controlsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  monthDisplay: {
    fontSize: '18px',
    fontWeight: '600',
    minWidth: '150px',
    textAlign: 'right'
  },
  controls: {
    display: 'flex',
    gap: '8px'
  },
  navButton: {
    padding: '10px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  todayButton: {
    padding: '10px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  }
};
