export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          feature_id: string
          user_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          feature_id: string
          user_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          feature_id?: string
          user_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      custom_field_defs: {
        Row: {
          id: string
          user_id: string
          name: string
          field_type: string
          entity_type: string
          options: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          field_type: string
          entity_type: string
          options?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          field_type?: string
          entity_type?: string
          options?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          id: string
          field_def_id: string
          entity_id: string
          value: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          field_def_id: string
          entity_id: string
          value?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          field_def_id?: string
          entity_id?: string
          value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      features: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      milestones: {
        Row: {
          id: string
          feature_id: string
          title: string
          date: string
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          feature_id: string
          title: string
          date: string
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          feature_id?: string
          title?: string
          date?: string
          color?: string | null
          created_at?: string
        }
        Relationships: []
      }
      version_dependencies: {
        Row: {
          id: string
          source_id: string
          target_id: string
          dependency_type: string
          created_at: string
        }
        Insert: {
          id?: string
          source_id: string
          target_id: string
          dependency_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          source_id?: string
          target_id?: string
          dependency_type?: string
          created_at?: string
        }
        Relationships: []
      }
      jira_connections: {
        Row: {
          id: string
          user_id: string
          base_url: string
          email: string
          api_token: string
          project_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          base_url: string
          email: string
          api_token: string
          project_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          base_url?: string
          email?: string
          api_token?: string
          project_key?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string | null
          read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          body?: string | null
          read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string | null
          read?: boolean
          link?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          wsjf_bv_weight: number | null
          wsjf_tc_weight: number | null
          wsjf_rr_weight: number | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          wsjf_bv_weight?: number | null
          wsjf_tc_weight?: number | null
          wsjf_rr_weight?: number | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          wsjf_bv_weight?: number | null
          wsjf_tc_weight?: number | null
          wsjf_rr_weight?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_roadmap_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          token?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          created_at?: string
        }
        Relationships: []
      }
      score_history: {
        Row: {
          id: string
          version_id: string
          wsjf_score: number | null
          business_value: number | null
          time_criticality: number | null
          risk_reduction: number | null
          job_size: number | null
          recorded_at: string
        }
        Insert: {
          id?: string
          version_id: string
          wsjf_score?: number | null
          business_value?: number | null
          time_criticality?: number | null
          risk_reduction?: number | null
          job_size?: number | null
          recorded_at?: string
        }
        Update: {
          id?: string
          version_id?: string
          wsjf_score?: number | null
          business_value?: number | null
          time_criticality?: number | null
          risk_reduction?: number | null
          job_size?: number | null
          recorded_at?: string
        }
        Relationships: []
      }
      sprints: {
        Row: {
          id: string
          feature_id: string
          name: string
          start_date: string | null
          end_date: string | null
          goal: string | null
          created_at: string
        }
        Insert: {
          id?: string
          feature_id: string
          name: string
          start_date?: string | null
          end_date?: string | null
          goal?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          feature_id?: string
          name?: string
          start_date?: string | null
          end_date?: string | null
          goal?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sprint_tasks: {
        Row: {
          sprint_id: string
          task_id: string
        }
        Insert: {
          sprint_id: string
          task_id: string
        }
        Update: {
          sprint_id?: string
          task_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string | null
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      feature_tags: {
        Row: {
          feature_id: string
          tag_id: string
          tags: { id: string; name: string; color: string } | null
        }
        Insert: {
          feature_id: string
          tag_id: string
        }
        Update: {
          feature_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      task_watchers: {
        Row: {
          task_id: string
          user_id: string
        }
        Insert: {
          task_id: string
          user_id?: string
        }
        Update: {
          task_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          jira_issue_key: string | null
          priority: number
          status: string
          title: string
          version_id: string
          watcher_count: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          jira_issue_key?: string | null
          priority?: number
          status?: string
          title: string
          version_id: string
          watcher_count?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          jira_issue_key?: string | null
          priority?: number
          status?: string
          title?: string
          version_id?: string
          watcher_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "versions"
            referencedColumns: ["id"]
          },
        ]
      }
      version_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          data?: Json
          created_at?: string
        }
        Relationships: []
      }
      versions: {
        Row: {
          archived_at: string | null
          business_value: number
          created_at: string
          due_date: string | null
          feature_id: string
          id: string
          jira_epic_key: string | null
          job_size: number
          risk_reduction: number
          start_date: string | null
          status: string
          time_criticality: number
          version_name: string
          wsjf_score: number | null
        }
        Insert: {
          archived_at?: string | null
          business_value?: number
          created_at?: string
          due_date?: string | null
          feature_id: string
          id?: string
          jira_epic_key?: string | null
          job_size?: number
          risk_reduction?: number
          start_date?: string | null
          status?: string
          time_criticality?: number
          version_name: string
          wsjf_score?: number | null
        }
        Update: {
          archived_at?: string | null
          business_value?: number
          created_at?: string
          due_date?: string | null
          feature_id?: string
          id?: string
          jira_epic_key?: string | null
          job_size?: number
          risk_reduction?: number
          start_date?: string | null
          status?: string
          time_criticality?: number
          version_name?: string
          wsjf_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "versions_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
