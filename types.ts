export enum AppMode {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT'
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  currentImage: GeneratedImage | null;
}
