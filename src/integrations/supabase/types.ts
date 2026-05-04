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
      company_profiles: {
        Row: {
          additional_gsts: string[] | null
          address: string | null
          annual_turnover: string | null
          authorized_signatory_designation: string | null
          authorized_signatory_name: string | null
          bank_account: string | null
          bank_name: string | null
          bee_rating: string | null
          bis_number: string | null
          business_type: string | null
          certifications: string[] | null
          cin: string | null
          company_name: string
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          dd_bank: string | null
          dd_favouring: string | null
          dpiit_number: string | null
          dsc_expiry: string | null
          duns_number: string | null
          employees_count: string | null
          epf_code: string | null
          escalation_l1_email: string | null
          escalation_l1_name: string | null
          escalation_l2_email: string | null
          escalation_l2_name: string | null
          escalation_l3_email: string | null
          escalation_l3_name: string | null
          esic_code: string | null
          gem_seller_id: string | null
          gst: string | null
          id: string
          ifsc_code: string | null
          iso_expiry: string | null
          iso_number: string | null
          land_border_equity: boolean | null
          local_content_percentage: string | null
          mii_class: string | null
          msme: boolean
          nature_of_business: string | null
          net_worth: string | null
          nsic_number: string | null
          office_city: string | null
          office_state: string | null
          organization_id: string | null
          pan: string | null
          past_projects: string[] | null
          startup: boolean
          stqc_number: string | null
          subletting_allowed: boolean | null
          support_email: string | null
          support_phone: string | null
          tan: string | null
          turnover_y1: string | null
          turnover_y2: string | null
          turnover_y3: string | null
          udyam_number: string | null
          updated_at: string
          user_id: string | null
          year_of_incorporation: string | null
          years_experience: string | null
        }
        Insert: {
          additional_gsts?: string[] | null
          address?: string | null
          annual_turnover?: string | null
          authorized_signatory_designation?: string | null
          authorized_signatory_name?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bee_rating?: string | null
          bis_number?: string | null
          business_type?: string | null
          certifications?: string[] | null
          cin?: string | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          dd_bank?: string | null
          dd_favouring?: string | null
          dpiit_number?: string | null
          dsc_expiry?: string | null
          duns_number?: string | null
          employees_count?: string | null
          epf_code?: string | null
          escalation_l1_email?: string | null
          escalation_l1_name?: string | null
          escalation_l2_email?: string | null
          escalation_l2_name?: string | null
          escalation_l3_email?: string | null
          escalation_l3_name?: string | null
          esic_code?: string | null
          gem_seller_id?: string | null
          gst?: string | null
          id?: string
          ifsc_code?: string | null
          iso_expiry?: string | null
          iso_number?: string | null
          land_border_equity?: boolean | null
          local_content_percentage?: string | null
          mii_class?: string | null
          msme?: boolean
          nature_of_business?: string | null
          net_worth?: string | null
          nsic_number?: string | null
          office_city?: string | null
          office_state?: string | null
          organization_id?: string | null
          pan?: string | null
          past_projects?: string[] | null
          startup?: boolean
          stqc_number?: string | null
          subletting_allowed?: boolean | null
          support_email?: string | null
          support_phone?: string | null
          tan?: string | null
          turnover_y1?: string | null
          turnover_y2?: string | null
          turnover_y3?: string | null
          udyam_number?: string | null
          updated_at?: string
          user_id?: string | null
          year_of_incorporation?: string | null
          years_experience?: string | null
        }
        Update: {
          additional_gsts?: string[] | null
          address?: string | null
          annual_turnover?: string | null
          authorized_signatory_designation?: string | null
          authorized_signatory_name?: string | null
          bank_account?: string | null
          bank_name?: string | null
          bee_rating?: string | null
          bis_number?: string | null
          business_type?: string | null
          certifications?: string[] | null
          cin?: string | null
          company_name?: string
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          dd_bank?: string | null
          dd_favouring?: string | null
          dpiit_number?: string | null
          dsc_expiry?: string | null
          duns_number?: string | null
          employees_count?: string | null
          epf_code?: string | null
          escalation_l1_email?: string | null
          escalation_l1_name?: string | null
          escalation_l2_email?: string | null
          escalation_l2_name?: string | null
          escalation_l3_email?: string | null
          escalation_l3_name?: string | null
          esic_code?: string | null
          gem_seller_id?: string | null
          gst?: string | null
          id?: string
          ifsc_code?: string | null
          iso_expiry?: string | null
          iso_number?: string | null
          land_border_equity?: boolean | null
          local_content_percentage?: string | null
          mii_class?: string | null
          msme?: boolean
          nature_of_business?: string | null
          net_worth?: string | null
          nsic_number?: string | null
          office_city?: string | null
          office_state?: string | null
          organization_id?: string | null
          pan?: string | null
          past_projects?: string[] | null
          startup?: boolean
          stqc_number?: string | null
          subletting_allowed?: boolean | null
          support_email?: string | null
          support_phone?: string | null
          tan?: string | null
          turnover_y1?: string | null
          turnover_y2?: string | null
          turnover_y3?: string | null
          udyam_number?: string | null
          updated_at?: string
          user_id?: string | null
          year_of_incorporation?: string | null
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          joined_at: string
          organization_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          slug: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "org_admin"
        | "proposal_manager"
        | "tender_analyst"
        | "reviewer"
        | "viewer"
      invitation_status: "pending" | "accepted" | "revoked" | "expired"
      plan_tier: "trial" | "starter" | "professional" | "enterprise"
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
      app_role: [
        "super_admin",
        "org_admin",
        "proposal_manager",
        "tender_analyst",
        "reviewer",
        "viewer",
      ],
      invitation_status: ["pending", "accepted", "revoked", "expired"],
      plan_tier: ["trial", "starter", "professional", "enterprise"],
    },
  },
} as const
