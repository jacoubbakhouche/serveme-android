export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          ad_type: string
          created_at: string
          created_by: string
          description: string | null
          duration_hours: number
          expires_at: string
          id: string
          image_url: string
          is_active: boolean
          title: string
        }
        Insert: {
          ad_type: string
          created_at?: string
          created_by: string
          description?: string | null
          duration_hours?: number
          expires_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          title: string
        }
        Update: {
          ad_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          duration_hours?: number
          expires_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limit: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: unknown
          last_attempt: string
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: unknown
          last_attempt?: string
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          last_attempt?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_1: string
          participant_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1: string
          participant_2: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1?: string
          participant_2?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          is_provider: boolean
          is_verified: boolean
          location: string | null
          phone: string | null
          provider_category: string | null
          rating: number | null
          review_count: number | null
          specialties: string[] | null
          subscription_expires_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          is_provider?: boolean
          is_verified?: boolean
          location?: string | null
          phone?: string | null
          provider_category?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          is_provider?: boolean
          is_verified?: boolean
          location?: string | null
          phone?: string | null
          provider_category?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_portfolios: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          provider_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_portfolios_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_portfolios_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget: string | null
          category: string
          created_at: string
          description: string
          id: string
          image_urls: string[] | null
          is_urgent: boolean
          location: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          image_urls?: string[] | null
          is_urgent?: boolean
          location: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_urls?: string[] | null
          is_urgent?: boolean
          location?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          contact_number: string | null
          created_at: string
          description: string
          id: string
          image_urls: string[] | null
          is_urgent: boolean
          location: string
          title: string
          user_id: string
        }
        Insert: {
          category: string
          contact_number?: string | null
          created_at?: string
          description: string
          id?: string
          image_urls?: string[] | null
          is_urgent?: boolean
          location: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          contact_number?: string | null
          created_at?: string
          description?: string
          id?: string
          image_urls?: string[] | null
          is_urgent?: boolean
          location?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_providers: {
        Row: {
          avatar_url: string | null
          current_subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          full_name: string | null
          id: string | null
          is_provider: boolean | null
          is_subscription_active: boolean | null
          is_verified: boolean | null
          location: string | null
          phone: string | null
          provider_category: string | null
          rating: number | null
          review_count: number | null
          specialties: string[] | null
          subscription_expires_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          current_subscription_status?: never
          full_name?: string | null
          id?: string | null
          is_provider?: boolean | null
          is_subscription_active?: never
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          provider_category?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          current_subscription_status?: never
          full_name?: string | null
          id?: string | null
          is_provider?: boolean | null
          is_subscription_active?: never
          is_verified?: boolean | null
          location?: string | null
          phone?: string | null
          provider_category?: string | null
          rating?: number | null
          review_count?: number | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      deactivate_expired_ads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_or_create_conversation: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      handle_expired_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_status:
        | "free"
        | "pending_payment"
        | "active"
        | "expired"
        | "cancelled"
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
    Enums: {
      app_role: ["admin", "user"],
      subscription_status: [
        "free",
        "pending_payment",
        "active",
        "expired",
        "cancelled",
      ],
    },
  },
} as const
