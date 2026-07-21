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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_deletion_feedback: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string | null
          seconds_since_signup: number | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string | null
          seconds_since_signup?: number | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string | null
          seconds_since_signup?: number | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: string
          props: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          props?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          props?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_secrets: {
        Row: {
          name: string
          value: string
        }
        Insert: {
          name: string
          value: string
        }
        Update: {
          name?: string
          value?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          keywords: string[] | null
          meta_description: string | null
          published: boolean
          read_time_minutes: number | null
          slug: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          published?: boolean
          read_time_minutes?: number | null
          slug: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          keywords?: string[] | null
          meta_description?: string | null
          published?: boolean
          read_time_minutes?: number | null
          slug?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      blog_posts_backup_20260712: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string | null
          keywords: string[] | null
          meta_description: string | null
          published: boolean | null
          read_time_minutes: number | null
          slug: string | null
          title: string | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          published?: boolean | null
          read_time_minutes?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          published?: boolean | null
          read_time_minutes?: number | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          city_name: string
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          population: number | null
          slug: string
          state_province: string | null
          updated_at: string
        }
        Insert: {
          city_name: string
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          slug: string
          state_province?: string | null
          updated_at?: string
        }
        Update: {
          city_name?: string
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          slug?: string
          state_province?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      codenames: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          emoji: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          emoji?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          emoji?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          profile_id: string | null
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          profile_id?: string | null
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          profile_id?: string | null
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_requests: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          contact_email: string
          created_at: string | null
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          story_id: string | null
          subject_name: string
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          contact_email: string
          created_at?: string | null
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          story_id?: string | null
          subject_name: string
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          contact_email?: string
          created_at?: string | null
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          story_id?: string | null
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_requests_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      email_optouts: {
        Row: {
          created_at: string
          email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      file_access_logs: {
        Row: {
          action: string
          bucket_id: string
          created_at: string
          id: string
          ip_address: unknown
          object_path: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          bucket_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          object_path: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          bucket_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          object_path?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          anonymous_username: string
          city: string | null
          city_id: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          phone_number: string | null
          referral_prompt_dismissed: boolean
          referral_source: string | null
          relationship_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anonymous_username: string
          city?: string | null
          city_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          phone_number?: string | null
          referral_prompt_dismissed?: boolean
          referral_source?: string | null
          relationship_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anonymous_username?: string
          city?: string | null
          city_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          phone_number?: string | null
          referral_prompt_dismissed?: boolean
          referral_source?: string | null
          relationship_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action_type: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          action_type?: string
          attempt_count?: number
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_config: {
        Row: {
          configured_at: string | null
          id: string
          is_enabled: boolean
          notes: string | null
          setting_name: string
        }
        Insert: {
          configured_at?: string | null
          id?: string
          is_enabled?: boolean
          notes?: string | null
          setting_name: string
        }
        Update: {
          configured_at?: string | null
          id?: string
          is_enabled?: boolean
          notes?: string | null
          setting_name?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city_id: string | null
          comments_count: number
          communication_rating: number | null
          content: string
          created_at: string
          emotional_safety_rating: number | null
          id: string
          image_url: string | null
          is_flagged: boolean
          is_seed: boolean
          location: string | null
          loyalty_rating: number | null
          normalized_location: string | null
          overall_vibe_rating: number | null
          profile_id: string | null
          reactions_count: number
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          subject_name: string | null
          subject_phone_hash: string | null
          submitted_anonymously: boolean
          updated_at: string
          user_id: string | null
          view_count: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city_id?: string | null
          comments_count?: number
          communication_rating?: number | null
          content: string
          created_at?: string
          emotional_safety_rating?: number | null
          id?: string
          image_url?: string | null
          is_flagged?: boolean
          is_seed?: boolean
          location?: string | null
          loyalty_rating?: number | null
          normalized_location?: string | null
          overall_vibe_rating?: number | null
          profile_id?: string | null
          reactions_count?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          subject_name?: string | null
          subject_phone_hash?: string | null
          submitted_anonymously?: boolean
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city_id?: string | null
          comments_count?: number
          communication_rating?: number | null
          content?: string
          created_at?: string
          emotional_safety_rating?: number | null
          id?: string
          image_url?: string | null
          is_flagged?: boolean
          is_seed?: boolean
          location?: string | null
          loyalty_rating?: number | null
          normalized_location?: string | null
          overall_vibe_rating?: number | null
          profile_id?: string | null
          reactions_count?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          subject_name?: string | null
          subject_phone_hash?: string | null
          submitted_anonymously?: boolean
          updated_at?: string
          user_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "stories_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_tags: {
        Row: {
          created_at: string
          id: string
          story_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_tags_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_suspensions: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          created_at: string
          deleted_by: string | null
          id: string
          notes: string | null
          selfie_deleted_at: string | null
          selfie_url: string | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          deleted_by?: string | null
          id?: string
          notes?: string | null
          selfie_deleted_at?: string | null
          selfie_url?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          deleted_by?: string | null
          id?: string
          notes?: string | null
          selfie_deleted_at?: string | null
          selfie_url?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_seed_story: {
        Args: {
          p_communication?: number
          p_content: string
          p_emotional_safety?: number
          p_image_url?: string
          p_location?: string
          p_loyalty?: number
          p_subject_name?: string
          p_vibe?: number
        }
        Returns: string
      }
      admin_delete_seed_story: { Args: { p_id: string }; Returns: undefined }
      admin_list_members: {
        Args: never
        Returns: {
          anonymous_username: string
          city: string
          created_at: string
          email: string
          has_post: boolean
          user_id: string
          verification_status: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_block_minutes?: number
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      detect_suspicious_activity: {
        Args: { p_activity_type: string; p_details?: Json; p_user_id: string }
        Returns: undefined
      }
      generate_city_slug: { Args: { city_name_param: string }; Returns: string }
      generate_slug: { Args: { title_text: string }; Returns: string }
      get_search_miss_candidates: {
        Args: { max_rows?: number }
        Returns: {
          last_miss: string
          subject_name: string
          user_id: string
        }[]
      }
      get_story_owner: { Args: { _story_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_subject_phone: { Args: { p: string }; Returns: string }
      internal_secret: { Args: { p_name: string }; Returns: string }
      is_blocked: {
        Args: { _actor: string; _target: string }
        Returns: boolean
      }
      is_pg_net_exception_acceptable: { Args: never; Returns: boolean }
      is_seed_story: { Args: { _story_id: string }; Returns: boolean }
      is_user_suspended: { Args: { _user: string }; Returns: boolean }
      is_user_verified: { Args: { _user_id: string }; Returns: boolean }
      is_username_available: { Args: { username: string }; Returns: boolean }
      is_valid_email_domain: { Args: { email_param: string }; Returns: boolean }
      log_file_access: {
        Args: {
          p_action: string
          p_bucket_id: string
          p_ip_address?: unknown
          p_object_path: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      normalize_city_name: { Args: { city_input: string }; Returns: string }
      normalize_phone_number: { Args: { phone_input: string }; Returns: string }
      processed_selfie_object_names: { Args: never; Returns: string[] }
      search_stories_by_phone: {
        Args: { p: string }
        Returns: {
          approved_at: string | null
          approved_by: string | null
          city_id: string | null
          comments_count: number
          communication_rating: number | null
          content: string
          created_at: string
          emotional_safety_rating: number | null
          id: string
          image_url: string | null
          is_flagged: boolean
          is_seed: boolean
          location: string | null
          loyalty_rating: number | null
          normalized_location: string | null
          overall_vibe_rating: number | null
          profile_id: string | null
          reactions_count: number
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          subject_name: string | null
          subject_phone_hash: string | null
          submitted_anonymously: boolean
          updated_at: string
          user_id: string | null
          view_count: number
        }[]
        SetofOptions: {
          from: "*"
          to: "stories"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_subject_preview: {
        Args: { q: string }
        Returns: {
          avg_vibe: number
          is_seed: boolean
          preview: string
          review_count: number
          subject_name: string
        }[]
      }
      set_story_subject_phone_hash: {
        Args: { p_phone: string; p_story_id: string }
        Returns: undefined
      }
      user_has_approved_post: { Args: { _user_id: string }; Returns: boolean }
      validate_file_upload: {
        Args: {
          bucket_name: string
          file_name: string
          file_size: number
          mime_type: string
        }
        Returns: boolean
      }
      validate_phone_number: { Args: { phone_param: string }; Returns: boolean }
      validate_story_content: {
        Args: { content_param: string }
        Returns: boolean
      }
      validate_subject_phone: {
        Args: { phone_param: string }
        Returns: boolean
      }
      validate_username: { Args: { username_param: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
