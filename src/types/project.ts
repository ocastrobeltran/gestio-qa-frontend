import type { User } from "./user"

export type ProjectStatus = "En análisis" | "En validación" | "En pruebas" | "Aprobado" | "Cancelado";
export type ProjectPriority = "Alta" | "Media" | "Baja";
export type DefectSeverity = "Crítico" | "Mayor" | "Menor" | "Cosmético";
export type DefectStatus = "Abierto" | "En revisión" | "Corregido" | "Verificado" | "Cerrado";

export interface Defect {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  severity: DefectSeverity;
  status: DefectStatus;
  reported_by: number;
  assigned_to?: number;
  reported_at: string;
  updated_at: string;
  closed_at?: string;
  reporter?: {
    id: number;
    full_name: string;
    email: string;
  };
  assignee?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface Project {
  id: number;
  title: string;
  initiative: string;
  client: string;
  pm: string;
  defects?: Defect[];
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
