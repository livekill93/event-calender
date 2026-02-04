import React, { useState } from 'react';
import { Event } from '../services/api';

interface EventModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose }) => {
  if (!isOpen || !event) {
    return null;
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>{event.title}</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          <div style={styles.section}>
            <strong>Game:</strong> {event.game_name}
          </div>

          <div style={styles.section}>
            <strong>Date:</strong>{' '}
            {event.start_date}
            {event.end_date && event.end_date !== event.start_date && (
              <> to {event.end_date}</>
            )}
          </div>

          {event.description && (
            <div style={styles.section}>
              <strong>Description:</strong>
              <p style={styles.description}>{event.description}</p>
            </div>
          )}

          <div style={styles.section}>
            <a
              href={event.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              View on YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  } as React.CSSProperties,
  modal: {
    backgroundColor: 'var(--background-color)',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '2px solid var(--border-color)',
    backgroundColor: '#f9fafb'
  } as React.CSSProperties,
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    color: 'var(--text-secondary)',
    transition: 'color 0.2s ease',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,
  content: {
    padding: '24px'
  } as React.CSSProperties,
  section: {
    marginBottom: '20px'
  } as React.CSSProperties,
  description: {
    marginTop: '8px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: 'var(--text-primary)',
    fontSize: '14px'
  } as React.CSSProperties,
  link: {
    color: 'var(--primary-color)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'color 0.2s ease'
  } as React.CSSProperties
};
