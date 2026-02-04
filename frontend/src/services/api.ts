import axios, { AxiosInstance } from 'axios';

export interface Channel {
  id?: number;
  game_name: string;
  channel_url: string;
  channel_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
  id?: number;
  event_id: string;
  game_name: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  source_url: string;
  video_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
  total?: number;
  statusCode?: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Channel endpoints
  async getChannels(): Promise<Channel[]> {
    const response = await this.client.get<ApiResponse<Channel[]>>('/channels');
    return response.data.data || [];
  }

  async getChannel(id: number): Promise<Channel | null> {
    try {
      const response = await this.client.get<ApiResponse<Channel>>(`/channels/${id}`);
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  }

  async createChannel(channel: Omit<Channel, 'id' | 'channel_id'>): Promise<Channel> {
    const response = await this.client.post<ApiResponse<Channel>>('/channels', channel);
    if (!response.data.data) {
      throw new Error('Failed to create channel');
    }
    return response.data.data;
  }

  async updateChannel(id: number, channel: Partial<Channel>): Promise<Channel> {
    const response = await this.client.put<ApiResponse<Channel>>(`/channels/${id}`, channel);
    if (!response.data.data) {
      throw new Error('Failed to update channel');
    }
    return response.data.data;
  }

  async deleteChannel(id: number): Promise<void> {
    await this.client.delete(`/channels/${id}`);
  }

  async syncChannel(id: number): Promise<void> {
    await this.client.post(`/channels/${id}/sync`);
  }

  // Event endpoints
  async getEvents(): Promise<Event[]> {
    const response = await this.client.get<ApiResponse<Event[]>>('/events');
    return response.data.data || [];
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<Event[]> {
    const response = await this.client.get<ApiResponse<Event[]>>('/events/by-date', {
      params: { startDate, endDate }
    });
    return response.data.data || [];
  }

  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const response = await this.client.get<ApiResponse<Event[]>>(
      `/events/by-month/${year}/${month}`
    );
    return response.data.data || [];
  }

  async getEventsByGame(gameName: string): Promise<Event[]> {
    const response = await this.client.get<ApiResponse<Event[]>>(
      `/events/by-game/${encodeURIComponent(gameName)}`
    );
    return response.data.data || [];
  }

  async getEvent(id: number): Promise<Event | null> {
    try {
      const response = await this.client.get<ApiResponse<Event>>(`/events/${id}`);
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  }

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const response = await this.client.post<ApiResponse<Event>>('/events', event);
    if (!response.data.data) {
      throw new Error('Failed to create event');
    }
    return response.data.data;
  }

  async updateEvent(id: number, event: Partial<Event>): Promise<Event> {
    const response = await this.client.put<ApiResponse<Event>>(`/events/${id}`, event);
    if (!response.data.data) {
      throw new Error('Failed to update event');
    }
    return response.data.data;
  }

  async deleteEvent(id: number): Promise<void> {
    await this.client.delete(`/events/${id}`);
  }
}

export const apiClient = new ApiClient();
