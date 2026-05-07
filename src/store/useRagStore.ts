import { create } from 'zustand';
import { apiService } from '../services/api';

interface RagState {
    collections: string[];
    selectedCollection: string | null;
    isLoading: boolean;

    // Actions
    fetchCollections: () => Promise<void>;
    setSelectedCollection: (name: string | null) => void;
}

export const useRagStore = create<RagState>((set, get) => ({
    collections: [],
    selectedCollection: null,
    isLoading: false,

    fetchCollections: async () => {
        set({ isLoading: true });
        try {
            const data = await apiService.ragListCollections();
            //console.log(data);
            const currentSelected = get().selectedCollection;
            set({
                collections: data,
                selectedCollection: (currentSelected && data.includes(currentSelected)) 
                    ? currentSelected 
                    : (data.length > 0 ? data[0] : null)
            });
        } catch (error) {
            console.error('Failed to load collections:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    setSelectedCollection: (name) => set({ selectedCollection: name }),
}));