import type { User } from "./user"

export interface Project {
  id: number
  title: string
  initiative: string
  client: string
  pm: string
  lead_dev: string
  designer?: string
  design_url?: string
  test_url?: string
  qa_analyst_id?: number
  status: ProjectStatus
  created_by: number
  created_at: string
  updated_at: string
  qaAnalyst?: User
  creator?: User
  developers?: Developer[]
  assets?: Asset[]
  comments?: Comment[]
  history?: HistoryEntry[]
}

export type ProjectStatus = "En análisis" | "En validación" | "En pruebas" | "Aprobado" | "Cancelado"

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
