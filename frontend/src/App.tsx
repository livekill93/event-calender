import React, { useState, useEffect } from 'react';
import { Channel, apiClient } from './services/api';
import { Header } from './components/Header';
import { Calendar } from './components/Calendar';
import { ChannelManager } from './components/ChannelManager';

function App() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [channels, setChannels] = useState<Channel[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const data = await apiClient.getChannels();
      setChannels(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch channels');
      console.error(err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div style={styles.app}>
      <Header
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      <div style={styles.container}>
        {error && <div style={styles.errorMessage}>{error}</div>}

        <ChannelManager
          channels={channels}
          onChannelAdded={fetchChannels}
          onChannelDeleted={fetchChannels}
        />

        <Calendar selectedMonth={currentMonth} />
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    flexDirection: 'column'
  } as React.CSSProperties,
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px 40px',
    width: '100%',
    flex: 1
  } as React.CSSProperties,
  errorMessage: {
    padding: '16px',
    marginBottom: '24px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '14px',
    fontWeight: '500'
  } as React.CSSProperties
};

export default App;
