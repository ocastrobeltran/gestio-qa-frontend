import type { User } from "./user"

export type ProjectStatus = "En análisis" | "En validación" | "En pruebas" | "Aprobado" | "Cancelado";
export type ProjectPriority = "Alta" | "Media" | "Baja";

export interface Project {
  id: number;
  title: string;
  initiative: string;
  client: string;
  pm: string;
  lead_dev: string;
  designer: string | null;
  design_url: string | null;
  test_url: string | null;
  qa_analyst_id: number | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  created_by: number;
  created_at: string;
  updated_at: string;
  qaAnalyst: {
    id: number;
    full_name: string;
    email: string;
  } | null;
  creator: {
    id: number;
    full_name: string;
    email: string;
  };
  developers: {
    id: number;
    developer_name: string;
  }[];
  assets: {
    id: number;
    asset_url: string;
  }[];
}

export interface Developer {
  id: number
  project_id: number
  developer_name: string
}

export interface Asset {
  id: number
  project_id: number
  asset_url: string
}

export interface Comment {
  id: number
  project_id: number
  user_id: number
  comment_text: string
  created_at: string
  author?: User
}

export interface HistoryEntry {
  id: number
  project_id: number
  changed_by: number
  change_type: string
  old_value?: string
  new_value?: string
  timestamp: string
  changer?: User
}
