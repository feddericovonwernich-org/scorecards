/**
 * Zustand App Store
 * Centralized state management for React components
 * Mirrors the existing services/state.ts structure for gradual migration
 * @module stores/appStore
 */

import { create } from 'zustand';
import type {
  ServiceData,
  TeamData,
  WorkflowRun,
  FilterMode,
} from '../types/index';

// ============= State Types =============

export interface ServicesState {
  all: ServiceData[];
  filtered: ServiceData[];
  loading: boolean;
}

export interface TeamsState {
  all: TeamData[];
  filtered: TeamData[];
  sort: string;
  search: string;
  activeFilters: Map<string, FilterMode>;
}

export interface FiltersState {
  active: Map<string, FilterMode>;
  search: string;
  sort: string;
}

export interface AuthState {
  pat: string | null;
  validated: boolean;
}

export interface UIState {
  currentModal: string | null;
  checksHash: string | null;
  checksHashTimestamp: number;
  currentView: 'services' | 'teams';
}

export interface ServiceModalState {
  org: string | null;
  repo: string | null;
  workflowRuns: WorkflowRun[];
  filterStatus: string;
  pollInterval: ReturnType<typeof setInterval> | null;
  pollIntervalTime: number;
  loaded: boolean;
  durationUpdateInterval: ReturnType<typeof setInterval> | null;
}

export interface AppState {
  // State slices
  services: ServicesState;
  teams: TeamsState;
  filters: FiltersState;
  auth: AuthState;
  ui: UIState;
  serviceModal: ServiceModalState;

  // Actions
  setServices: (services: ServiceData[]) => void;
  setFilteredServices: (services: ServiceData[]) => void;
  setServicesLoading: (loading: boolean) => void;
  setTeams: (teams: TeamData[]) => void;
  setFilteredTeams: (teams: TeamData[]) => void;
  setAuth: (pat: string | null, validated?: boolean) => void;
  setCurrentView: (view: 'services' | 'teams') => void;
  setChecksHash: (hash: string | null) => void;
  updateServiceModal: (updates: Partial<ServiceModalState>) => void;
  updateFilters: (updates: Partial<FiltersState>) => void;
  updateTeamsState: (updates: Partial<TeamsState>) => void;
  resetState: () => void;
}

// ============= Initial State =============

const initialState = {
  services: {
    all: [],
    filtered: [],
    loading: false,
  } as ServicesState,
  teams: {
    all: [],
    filtered: [],
    sort: 'score-desc',
    search: '',
    activeFilters: new Map<string, FilterMode>(),
  } as TeamsState,
  filters: {
    active: new Map<string, FilterMode>(),
    search: '',
    sort: 'score-desc',
  } as FiltersState,
  auth: {
    pat: null,
    validated: false,
  } as AuthState,
  ui: {
    currentModal: null,
    checksHash: null,
    checksHashTimestamp: 0,
    currentView: 'services' as const,
  } as UIState,
  serviceModal: {
    org: null,
    repo: null,
    workflowRuns: [],
    filterStatus: 'all',
    pollInterval: null,
    pollIntervalTime: 30000,
    loaded: false,
    durationUpdateInterval: null,
  } as ServiceModalState,
};

// ============= Store =============

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  ...initialState,

  // Services actions
  setServices: (services) =>
    set((state) => ({
      services: { ...state.services, all: services },
    })),

  setFilteredServices: (services) =>
    set((state) => ({
      services: { ...state.services, filtered: services },
    })),

  setServicesLoading: (loading) =>
    set((state) => ({
      services: { ...state.services, loading },
    })),

  // Teams actions
  setTeams: (teams) =>
    set((state) => ({
      teams: { ...state.teams, all: teams },
    })),

  setFilteredTeams: (teams) =>
    set((state) => ({
      teams: { ...state.teams, filtered: teams },
    })),

  updateTeamsState: (updates) =>
    set((state) => ({
      teams: { ...state.teams, ...updates },
    })),

  // Auth actions
  setAuth: (pat, validated = false) =>
    set(() => ({
      auth: { pat, validated },
    })),

  // UI actions
  setCurrentView: (view) =>
    set((state) => ({
      ui: { ...state.ui, currentView: view },
    })),

  setChecksHash: (hash) =>
    set((state) => ({
      ui: {
        ...state.ui,
        checksHash: hash,
        checksHashTimestamp: Date.now(),
      },
    })),

  // Service modal actions
  updateServiceModal: (updates) =>
    set((state) => ({
      serviceModal: { ...state.serviceModal, ...updates },
    })),

  // Filters actions
  updateFilters: (updates) =>
    set((state) => ({
      filters: { ...state.filters, ...updates },
    })),

  // Reset
  resetState: () => set(() => ({ ...initialState })),
}));

// ============= Selectors =============
// Use these to avoid unnecessary re-renders

export const selectServices = (state: AppState) => state.services;
export const selectServicesAll = (state: AppState) => state.services.all;
export const selectServicesFiltered = (state: AppState) =>
  state.services.filtered;
export const selectServicesLoading = (state: AppState) =>
  state.services.loading;

export const selectTeams = (state: AppState) => state.teams;
export const selectTeamsAll = (state: AppState) => state.teams.all;
export const selectTeamsFiltered = (state: AppState) => state.teams.filtered;

export const selectFilters = (state: AppState) => state.filters;
export const selectAuth = (state: AppState) => state.auth;
export const selectUI = (state: AppState) => state.ui;
export const selectCurrentView = (state: AppState) => state.ui.currentView;
export const selectServiceModal = (state: AppState) => state.serviceModal;

// ============= Vanilla JS Bridge =============
// These functions allow vanilla JS code to interact with the store

/**
 * Get full state (for vanilla JS compatibility)
 */
export function getStoreState() {
  return useAppStore.getState();
}

/**
 * Subscribe to store changes (for vanilla JS compatibility)
 * @returns Unsubscribe function
 */
export function subscribeToStore(callback: (state: AppState) => void) {
  return useAppStore.subscribe(callback);
}
