import React, { useState } from 'react';
import { Channel } from '../services/api';
import { apiClient } from '../services/api';

interface ChannelManagerProps {
  onChannelAdded: () => void;
  channels: Channel[];
  onChannelDeleted: () => void;
}

export const ChannelManager: React.FC<ChannelManagerProps> = ({
  onChannelAdded,
  channels,
  onChannelDeleted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [gameName, setGameName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.createChannel({
        game_name: gameName,
        channel_url: channelUrl
      });

      setGameName('');
      setChannelUrl('');
      setIsOpen(false);
      onChannelAdded();
    } catch (err) {
      setError((err as Error).message || 'Failed to add channel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;

    if (!window.confirm('Are you sure you want to delete this channel?')) {
      return;
    }

    try {
      await apiClient.deleteChannel(id);
      onChannelDeleted();
    } catch (err) {
      setError((err as Error).message || 'Failed to delete channel');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📺 YouTube 채널 관리</h2>
          <p style={styles.subtitle}>게임 채널을 추가하면 최신 이벤트를 자동으로 수집합니다</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{...styles.button, ...(isOpen ? styles.buttonActive : {})}}
        >
          {isOpen ? '✕ 취소' : '+ 채널 추가'}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="gameName" style={styles.label}>게임 이름</label>
            <input
              id="gameName"
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="예: Final Fantasy XIV"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="channelUrl" style={styles.label}>YouTube 채널 URL</label>
            <input
              id="channelUrl"
              type="url"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="예: https://www.youtube.com/@ChannelName"
              required
              style={styles.input}
            />
            <p style={styles.helpText}>💡 /channel/ID, /@handle, /c/custom 등 다양한 형식 지원</p>
          </div>

          {error && <div style={styles.error}>❌ {error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{...styles.submitButton, ...(loading ? styles.submitButtonDisabled : {})}}
          >
            {loading ? '⏳ 추가 중...' : '✓ 채널 추가'}
          </button>
        </form>
      )}

      <div style={styles.channelList}>
        <h3 style={styles.listTitle}>등록된 채널 ({channels.length})</h3>
        {channels.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyMessage}>등록된 채널이 없습니다</p>
            <p style={styles.emptyHint}>위의 "채널 추가" 버튼을 클릭하여 게임 채널을 등록해보세요!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {channels.map((channel) => (
              <div key={channel.id} style={styles.listItem}>
                <div style={styles.channelInfo}>
                  <h4 style={styles.channelName}>{channel.game_name}</h4>
                  <p style={styles.channelUrl}>{channel.channel_url}</p>
                </div>
                <button
                  onClick={() => handleDelete(channel.id)}
                  style={styles.deleteButton}
                  title="채널 삭제"
                >
                  🗑 삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    marginBottom: '24px',
    backgroundColor: 'var(--background-color)',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '2px solid var(--border-color)'
  } as React.CSSProperties,
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0
  } as React.CSSProperties,
  button: {
    padding: '10px 16px',
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
  } as React.CSSProperties,
  form: {
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid var(--border-color)'
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '16px'
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
    marginBottom: '8px'
  } as React.CSSProperties,
  input: {
    display: 'block',
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    color: 'var(--text-primary)',
    transition: 'border-color 0.2s ease'
  } as React.CSSProperties,
  helpText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginTop: '6px'
  } as React.CSSProperties,
  submitButton: {
    padding: '12px 24px',
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
  } as React.CSSProperties,
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
    boxShadow: 'none'
  } as React.CSSProperties,
  error: {
    color: '#dc2626',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    borderRadius: '6px',
    border: '1px solid #fecaca',
    fontSize: '14px'
  } as React.CSSProperties,
  channelList: {
    marginTop: '24px'
  } as React.CSSProperties,
  listTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 16px 0'
  } as React.CSSProperties,
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  } as React.CSSProperties,
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#fff',
    marginBottom: '12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    transition: 'box-shadow 0.2s ease'
  } as React.CSSProperties,
  channelInfo: {
    flex: 1
  } as React.CSSProperties,
  channelName: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0 0 4px 0'
  } as React.CSSProperties,
  channelUrl: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
    wordBreak: 'break-all'
  } as React.CSSProperties,
  deleteButton: {
    padding: '8px 12px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    marginLeft: '12px',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  } as React.CSSProperties,
  emptyState: {
    padding: '32px 16px',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px dashed var(--border-color)'
  } as React.CSSProperties,
  emptyMessage: {
    fontSize: '15px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    margin: '0 0 8px 0'
  } as React.CSSProperties,
  emptyHint: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: 0
  } as React.CSSProperties
};
