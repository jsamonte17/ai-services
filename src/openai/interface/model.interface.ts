export interface ListModelsInterface {
  apiKey?: string;
}

export interface DeleteModelInterface {
  modelId: string;
  apiKey?: string;
}

export interface FineTuneModelInterface {
  model: string;
  file: Express.Multer.File;
  suffix?: string;
}
