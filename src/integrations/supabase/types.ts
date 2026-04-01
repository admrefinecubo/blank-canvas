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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          field_type: string | null
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          field_type?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          field_type?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_flows: {
        Row: {
          actions: Json | null
          assigned_to: string | null
          category: string | null
          client_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          last_run_at: string | null
          n8n_workflow_url: string | null
          name: string
          notes: string | null
          priority: string | null
          project_id: string | null
          runs_count: number | null
          status: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          n8n_workflow_url?: string | null
          name: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          runs_count?: number | null
          status?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          assigned_to?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          n8n_workflow_url?: string | null
          name?: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          runs_count?: number | null
          status?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_settings: {
        Row: {
          auto_create_lead_sources: string[] | null
          created_at: string | null
          default_assignee: string | null
          id: string
          notify_roles: string[] | null
          stale_days_alert: number | null
          stale_days_warning: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_create_lead_sources?: string[] | null
          created_at?: string | null
          default_assignee?: string | null
          id?: string
          notify_roles?: string[] | null
          stale_days_alert?: number | null
          stale_days_warning?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_create_lead_sources?: string[] | null
          created_at?: string | null
          default_assignee?: string | null
          id?: string
          notify_roles?: string[] | null
          stale_days_alert?: number | null
          stale_days_warning?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          attendees: string[] | null
          client_id: string | null
          color: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          event_type: string | null
          google_event_id: string | null
          html_link: string | null
          id: string
          meet_link: string | null
          project_id: string | null
          source: string | null
          start_date: string
          title: string
        }
        Insert: {
          all_day?: boolean | null
          attendees?: string[] | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          google_event_id?: string | null
          html_link?: string | null
          id?: string
          meet_link?: string | null
          project_id?: string | null
          source?: string | null
          start_date: string
          title: string
        }
        Update: {
          all_day?: boolean | null
          attendees?: string[] | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          google_event_id?: string | null
          html_link?: string | null
          id?: string
          meet_link?: string | null
          project_id?: string | null
          source?: string | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cost_per_conversion: number | null
          cost_per_lead: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          reach: number | null
          revenue: number | null
          roas: number | null
          spend: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_lead?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          reach?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_lead?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          reach?: number | null
          revenue?: number | null
          roas?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget: number | null
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          objective: string | null
          platform: string | null
          project_id: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          objective?: string | null
          platform?: string | null
          project_id: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          objective?: string | null
          platform?: string | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_files: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          field_type: string | null
          file_type: string | null
          id: string
          project_id: string | null
          source: string | null
          title: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          field_type?: string | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          source?: string | null
          title: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          field_type?: string | null
          file_type?: string | null
          id?: string
          project_id?: string | null
          source?: string | null
          title?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          interaction_date: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_date?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_date?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          project_id: string
          sender_email: string | null
          sender_name: string | null
          share_token: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          project_id: string
          sender_email?: string | null
          sender_name?: string | null
          share_token?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          project_id?: string
          sender_email?: string | null
          sender_name?: string | null
          share_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_month_closures: {
        Row: {
          avg_cpc: number | null
          avg_cpl: number | null
          avg_ctr: number | null
          campaigns_count: number | null
          client_id: string
          closed_at: string | null
          created_at: string | null
          id: string
          pdf_url: string | null
          period_end: string
          period_key: string
          period_start: string
          projects_count: number | null
          snapshot_data: Json | null
          status: string | null
          total_carousel_creatives: number | null
          total_clicks: number | null
          total_conversions: number | null
          total_impressions: number | null
          total_leads: number | null
          total_reach: number | null
          total_revenue: number | null
          total_roas: number | null
          total_spend: number | null
          total_static_creatives: number | null
        }
        Insert: {
          avg_cpc?: number | null
          avg_cpl?: number | null
          avg_ctr?: number | null
          campaigns_count?: number | null
          client_id: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          period_end: string
          period_key: string
          period_start: string
          projects_count?: number | null
          snapshot_data?: Json | null
          status?: string | null
          total_carousel_creatives?: number | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
          total_leads?: number | null
          total_reach?: number | null
          total_revenue?: number | null
          total_roas?: number | null
          total_spend?: number | null
          total_static_creatives?: number | null
        }
        Update: {
          avg_cpc?: number | null
          avg_cpl?: number | null
          avg_ctr?: number | null
          campaigns_count?: number | null
          client_id?: string
          closed_at?: string | null
          created_at?: string | null
          id?: string
          pdf_url?: string | null
          period_end?: string
          period_key?: string
          period_start?: string
          projects_count?: number | null
          snapshot_data?: Json | null
          status?: string | null
          total_carousel_creatives?: number | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
          total_leads?: number | null
          total_reach?: number | null
          total_revenue?: number | null
          total_roas?: number | null
          total_spend?: number | null
          total_static_creatives?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_month_closures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          contracted_plan: string | null
          country_code: string | null
          created_at: string | null
          email: string | null
          id: string
          monthly_plan_value: number | null
          name: string
          phone: string | null
          plan_billing_day: number | null
          plan_currency: string | null
          plan_start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          contracted_plan?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_plan_value?: number | null
          name: string
          phone?: string | null
          plan_billing_day?: number | null
          plan_currency?: string | null
          plan_start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          contracted_plan?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          monthly_plan_value?: number | null
          name?: string
          phone?: string | null
          plan_billing_day?: number | null
          plan_currency?: string | null
          plan_start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      closure_commissions: {
        Row: {
          amount: number | null
          base_value: number | null
          closure_id: string
          created_at: string | null
          description: string | null
          id: string
          paid: boolean | null
          paid_at: string | null
          percentage: number | null
          rule_id: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          amount?: number | null
          base_value?: number | null
          closure_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          rule_id?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          amount?: number | null
          base_value?: number | null
          closure_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          rule_id?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "closure_commissions_closure_id_fkey"
            columns: ["closure_id"]
            isOneToOne: false
            referencedRelation: "client_month_closures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closure_commissions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "commission_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_plans: {
        Row: {
          created_at: string | null
          created_by: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          base_field: string | null
          calc_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          target_role: string | null
          target_user_id: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          base_field?: string | null
          calc_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_role?: string | null
          target_user_id?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          base_field?: string | null
          calc_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_role?: string | null
          target_user_id?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          contract_type: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          terms: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          terms: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          terms?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          project_id: string | null
          status: string | null
          terms: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          terms?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          terms?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          drive_url: string
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          drive_url: string
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          drive_url?: string
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          project_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          project_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          project_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          agendado_para: string
          created_at: string | null
          enviado: boolean | null
          enviado_em: string | null
          id: string
          lead_id: string | null
          loja_id: string | null
          mensagem: string | null
          tipo: string
        }
        Insert: {
          agendado_para: string
          created_at?: string | null
          enviado?: boolean | null
          enviado_em?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          mensagem?: string | null
          tipo: string
        }
        Update: {
          agendado_para?: string
          created_at?: string | null
          enviado?: boolean | null
          enviado_em?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          mensagem?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_mensagens: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lead_id: string | null
          loja_id: string | null
          message_id: string | null
          role: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          message_id?: string | null
          role: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          message_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_mensagens_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_mensagens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          lead_id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          lead_id: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          agente_pausado: boolean | null
          canal_origem: string | null
          created_at: string | null
          email: string | null
          etapa_pipeline: string | null
          id: string
          instance: string
          interesse: string | null
          loja_id: string | null
          nome: string | null
          orcamento_faixa: string | null
          telefone: string
          ultima_interacao: string | null
          ultima_mensagem: string | null
        }
        Insert: {
          agente_pausado?: boolean | null
          canal_origem?: string | null
          created_at?: string | null
          email?: string | null
          etapa_pipeline?: string | null
          id?: string
          instance: string
          interesse?: string | null
          loja_id?: string | null
          nome?: string | null
          orcamento_faixa?: string | null
          telefone: string
          ultima_interacao?: string | null
          ultima_mensagem?: string | null
        }
        Update: {
          agente_pausado?: boolean | null
          canal_origem?: string | null
          created_at?: string | null
          email?: string | null
          etapa_pipeline?: string | null
          id?: string
          instance?: string
          interesse?: string | null
          loja_id?: string | null
          nome?: string | null
          orcamento_faixa?: string | null
          telefone?: string
          ultima_interacao?: string | null
          ultima_mensagem?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_execucao: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          evento: string | null
          execution_id: string | null
          id: string
          lead_id: string | null
          loja_id: string | null
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          evento?: string | null
          execution_id?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          evento?: string | null
          execution_id?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
        }
        Relationships: []
      }
      lojas: {
        Row: {
          created_at: string | null
          endereco: string | null
          especialidades: string | null
          formas_pagamento: string | null
          frete_gratis_acima: number | null
          grupo_vendedores: string | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          instance: string
          maps_link: string | null
          nome_assistente: string | null
          nome_loja: string
          politica_troca: string | null
          prazo_entrega: string | null
          tom_voz: string | null
        }
        Insert: {
          created_at?: string | null
          endereco?: string | null
          especialidades?: string | null
          formas_pagamento?: string | null
          frete_gratis_acima?: number | null
          grupo_vendedores?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          instance: string
          maps_link?: string | null
          nome_assistente?: string | null
          nome_loja: string
          politica_troca?: string | null
          prazo_entrega?: string | null
          tom_voz?: string | null
        }
        Update: {
          created_at?: string | null
          endereco?: string | null
          especialidades?: string | null
          formas_pagamento?: string | null
          frete_gratis_acima?: number | null
          grupo_vendedores?: string | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          instance?: string
          maps_link?: string | null
          nome_assistente?: string | null
          nome_loja?: string
          politica_troca?: string | null
          prazo_entrega?: string | null
          tom_voz?: string | null
        }
        Relationships: []
      }
      mensagens_processadas: {
        Row: {
          created_at: string | null
          instance: string | null
          message_id: string
          remoteJid: string | null
        }
        Insert: {
          created_at?: string | null
          instance?: string | null
          message_id: string
          remoteJid?: string | null
        }
        Update: {
          created_at?: string | null
          instance?: string | null
          message_id?: string
          remoteJid?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      midias_enviadas: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          loja_id: string | null
          produto_id: string | null
          tipo: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          produto_id?: string | null
          tipo?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          produto_id?: string | null
          tipo?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "midias_enviadas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "midias_enviadas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "midias_enviadas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_goals: {
        Row: {
          created_at: string | null
          id: string
          month: string
          revenue_goal: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: string
          revenue_goal?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: string
          revenue_goal?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          notify_contracts: boolean | null
          notify_messages: boolean | null
          notify_payments: boolean | null
          notify_tasks: boolean | null
          push_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_contracts?: boolean | null
          notify_messages?: boolean | null
          notify_payments?: boolean | null
          notify_tasks?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_contracts?: boolean | null
          notify_messages?: boolean | null
          notify_payments?: boolean | null
          notify_tasks?: boolean | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_recipients: {
        Row: {
          created_at: string | null
          id: string
          notification_id: string
          read: boolean | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_id: string
          read?: boolean | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_id?: string
          read?: boolean | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          external_id: string | null
          id: string
          read: boolean | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          external_id?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          external_id?: string | null
          id?: string
          read?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_reminders: {
        Row: {
          amount: number | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          reminder_date: string
          reminder_type: string | null
          sent_at: string | null
          title: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          reminder_date: string
          reminder_type?: string | null
          sent_at?: string | null
          title: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          reminder_date?: string
          reminder_type?: string | null
          sent_at?: string | null
          title?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_meetings: {
        Row: {
          at_time_sent_at: string | null
          confirmation_sent_at: string | null
          create_meet: boolean | null
          created_at: string | null
          created_by: string
          id: string
          location: string | null
          meeting_link: string | null
          notes: string | null
          pipeline_item_id: string
          reminder_sent_at: string | null
          scheduled_at: string
          status: string | null
        }
        Insert: {
          at_time_sent_at?: string | null
          confirmation_sent_at?: string | null
          create_meet?: boolean | null
          created_at?: string | null
          created_by: string
          id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          pipeline_item_id: string
          reminder_sent_at?: string | null
          scheduled_at: string
          status?: string | null
        }
        Update: {
          at_time_sent_at?: string | null
          confirmation_sent_at?: string | null
          create_meet?: boolean | null
          created_at?: string | null
          created_by?: string
          id?: string
          location?: string | null
          meeting_link?: string | null
          notes?: string | null
          pipeline_item_id?: string
          reminder_sent_at?: string | null
          scheduled_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_meetings_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "sales_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          categoria: string | null
          created_at: string | null
          descricao: string | null
          embedding: string | null
          especificacoes: Json | null
          estoque_disponivel: boolean | null
          foto_detalhe: string | null
          foto_principal: string | null
          id: string
          loja_id: string | null
          nome: string
          preco_original: number | null
          preco_promocional: number | null
          tags: string[] | null
          updated_at: string | null
          variacoes: Json | null
          video_url: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          embedding?: string | null
          especificacoes?: Json | null
          estoque_disponivel?: boolean | null
          foto_detalhe?: string | null
          foto_principal?: string | null
          id?: string
          loja_id?: string | null
          nome: string
          preco_original?: number | null
          preco_promocional?: number | null
          tags?: string[] | null
          updated_at?: string | null
          variacoes?: Json | null
          video_url?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          descricao?: string | null
          embedding?: string | null
          especificacoes?: Json | null
          estoque_disponivel?: boolean | null
          foto_detalhe?: string | null
          foto_principal?: string | null
          id?: string
          loja_id?: string | null
          nome?: string
          preco_original?: number | null
          preco_promocional?: number | null
          tags?: string[] | null
          updated_at?: string | null
          variacoes?: Json | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          revenue_goal: number | null
          status: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          revenue_goal?: number | null
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          revenue_goal?: number | null
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_alterations: {
        Row: {
          alteration_type: string
          created_at: string | null
          description: string | null
          id: string
          project_id: string
          value: number | null
        }
        Insert: {
          alteration_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          value?: number | null
        }
        Update: {
          alteration_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_alterations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_audiovisual: {
        Row: {
          created_at: string | null
          delivery_formats: string | null
          equipment_requirements: string | null
          id: string
          production_notes: string | null
          project_id: string
          script_notes: string | null
          style_references: string | null
          updated_at: string | null
          video_types: string[] | null
        }
        Insert: {
          created_at?: string | null
          delivery_formats?: string | null
          equipment_requirements?: string | null
          id?: string
          production_notes?: string | null
          project_id: string
          script_notes?: string | null
          style_references?: string | null
          updated_at?: string | null
          video_types?: string[] | null
        }
        Update: {
          created_at?: string | null
          delivery_formats?: string | null
          equipment_requirements?: string | null
          id?: string
          production_notes?: string | null
          project_id?: string
          script_notes?: string | null
          style_references?: string | null
          updated_at?: string | null
          video_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "project_audiovisual_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_branding: {
        Row: {
          brand_guidelines_url: string | null
          brand_voice: string | null
          color_palette: Json | null
          competitors: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          positioning_statement: string | null
          project_id: string
          target_audience: string | null
          typography: Json | null
          typography_notes: string | null
          updated_at: string | null
          visual_identity_notes: string | null
        }
        Insert: {
          brand_guidelines_url?: string | null
          brand_voice?: string | null
          color_palette?: Json | null
          competitors?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          positioning_statement?: string | null
          project_id: string
          target_audience?: string | null
          typography?: Json | null
          typography_notes?: string | null
          updated_at?: string | null
          visual_identity_notes?: string | null
        }
        Update: {
          brand_guidelines_url?: string | null
          brand_voice?: string | null
          color_palette?: Json | null
          competitors?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          positioning_statement?: string | null
          project_id?: string
          target_audience?: string | null
          typography?: Json | null
          typography_notes?: string | null
          updated_at?: string | null
          visual_identity_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_branding_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_change_requests: {
        Row: {
          attachments: string[] | null
          created_at: string | null
          created_by: string
          description: string
          id: string
          notes: string | null
          project_id: string
          requested_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          notes?: string | null
          project_id: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          notes?: string | null
          project_id?: string
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_copy_bank: {
        Row: {
          angle: string
          content: string
          created_at: string | null
          id: string
          project_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          angle: string
          content: string
          created_at?: string | null
          id?: string
          project_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          angle?: string
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_copy_bank_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_creatives: {
        Row: {
          created_at: string | null
          dark_post_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          project_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dark_post_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          project_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dark_post_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          project_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_creatives_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_crm_integration: {
        Row: {
          api_endpoint: string | null
          created_at: string | null
          crm_platform: string | null
          fields_mapped: string | null
          id: string
          integration_status: string | null
          notes: string | null
          project_id: string
          sync_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string | null
          crm_platform?: string | null
          fields_mapped?: string | null
          id?: string
          integration_status?: string | null
          notes?: string | null
          project_id: string
          sync_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string | null
          crm_platform?: string | null
          fields_mapped?: string | null
          id?: string
          integration_status?: string | null
          notes?: string | null
          project_id?: string
          sync_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_crm_integration_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_fields: {
        Row: {
          attachments: string[] | null
          content: string | null
          created_at: string | null
          field_type: string
          id: string
          last_edited_by: string | null
          link_url: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          field_type?: string
          id?: string
          last_edited_by?: string | null
          link_url?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          content?: string | null
          created_at?: string | null
          field_type?: string
          id?: string
          last_edited_by?: string | null
          link_url?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_financial_advisory: {
        Row: {
          budget_analysis: string | null
          cash_flow_notes: string | null
          created_at: string | null
          financial_goals: string | null
          id: string
          investment_recommendations: string | null
          project_id: string
          report_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          budget_analysis?: string | null
          cash_flow_notes?: string | null
          created_at?: string | null
          financial_goals?: string | null
          id?: string
          investment_recommendations?: string | null
          project_id: string
          report_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          budget_analysis?: string | null
          cash_flow_notes?: string | null
          created_at?: string | null
          financial_goals?: string | null
          id?: string
          investment_recommendations?: string | null
          project_id?: string
          report_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_financial_advisory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_gmb: {
        Row: {
          business_name: string | null
          categories: string | null
          created_at: string | null
          gmb_url: string | null
          id: string
          keywords: string | null
          performance_notes: string | null
          photos_notes: string | null
          posting_schedule: string | null
          project_id: string
          review_response_strategy: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          categories?: string | null
          created_at?: string | null
          gmb_url?: string | null
          id?: string
          keywords?: string | null
          performance_notes?: string | null
          photos_notes?: string | null
          posting_schedule?: string | null
          project_id: string
          review_response_strategy?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          categories?: string | null
          created_at?: string | null
          gmb_url?: string | null
          id?: string
          keywords?: string | null
          performance_notes?: string | null
          photos_notes?: string | null
          posting_schedule?: string | null
          project_id?: string
          review_response_strategy?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_gmb_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          content: string
          created_at: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_metrics: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          metric_type: string
          project_id: string
          value: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          metric_type: string
          project_id: string
          value?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          metric_type?: string
          project_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_optimization_log: {
        Row: {
          action_date: string
          action_description: string
          created_at: string | null
          id: string
          project_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action_date?: string
          action_description: string
          created_at?: string | null
          id?: string
          project_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action_date?: string
          action_description?: string
          created_at?: string | null
          id?: string
          project_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_optimization_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_payouts: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          member_name: string | null
          paid: boolean | null
          paid_at: string | null
          project_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_name?: string | null
          paid?: boolean | null
          paid_at?: string | null
          project_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_name?: string | null
          paid?: boolean | null
          paid_at?: string | null
          project_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_payouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_social_ai: {
        Row: {
          ai_instructions: string | null
          ai_tone: string | null
          auto_reply_comments: boolean | null
          auto_reply_dms: boolean | null
          created_at: string | null
          excluded_keywords: string | null
          facebook_token: string | null
          id: string
          instagram_token: string | null
          project_id: string
          response_delay_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          ai_instructions?: string | null
          ai_tone?: string | null
          auto_reply_comments?: boolean | null
          auto_reply_dms?: boolean | null
          created_at?: string | null
          excluded_keywords?: string | null
          facebook_token?: string | null
          id?: string
          instagram_token?: string | null
          project_id: string
          response_delay_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_instructions?: string | null
          ai_tone?: string | null
          auto_reply_comments?: boolean | null
          auto_reply_dms?: boolean | null
          created_at?: string | null
          excluded_keywords?: string | null
          facebook_token?: string | null
          id?: string
          instagram_token?: string | null
          project_id?: string
          response_delay_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_social_ai_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_social_calendar: {
        Row: {
          comments: number | null
          content: string | null
          created_at: string | null
          engagement_rate: number | null
          hashtags: string | null
          id: string
          impressions: number | null
          likes: number | null
          media_urls: string[] | null
          metrics_updated_at: string | null
          notes: string | null
          platform: string
          post_url: string | null
          project_id: string
          reach: number | null
          saves: number | null
          scheduled_date: string
          scheduled_time: string | null
          shares: number | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          comments?: number | null
          content?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtags?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          media_urls?: string[] | null
          metrics_updated_at?: string | null
          notes?: string | null
          platform: string
          post_url?: string | null
          project_id: string
          reach?: number | null
          saves?: number | null
          scheduled_date: string
          scheduled_time?: string | null
          shares?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          comments?: number | null
          content?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtags?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          media_urls?: string[] | null
          metrics_updated_at?: string | null
          notes?: string | null
          platform?: string
          post_url?: string | null
          project_id?: string
          reach?: number | null
          saves?: number | null
          scheduled_date?: string
          scheduled_time?: string | null
          shares?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_social_calendar_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_social_media: {
        Row: {
          brand_voice: string | null
          content_pillars: string | null
          created_at: string | null
          engagement_goals: string | null
          hashtag_strategy: string | null
          id: string
          platforms: string[] | null
          posting_frequency: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          brand_voice?: string | null
          content_pillars?: string | null
          created_at?: string | null
          engagement_goals?: string | null
          hashtag_strategy?: string | null
          id?: string
          platforms?: string[] | null
          posting_frequency?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          brand_voice?: string | null
          content_pillars?: string | null
          created_at?: string | null
          engagement_goals?: string | null
          hashtag_strategy?: string | null
          id?: string
          platforms?: string[] | null
          posting_frequency?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_social_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_strategy: {
        Row: {
          created_at: string | null
          funnel_structure: string | null
          id: string
          landing_page_test_url: string | null
          landing_page_url: string | null
          offer_big_idea: string | null
          personas: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          funnel_structure?: string | null
          id?: string
          landing_page_test_url?: string | null
          landing_page_url?: string | null
          offer_big_idea?: string | null
          personas?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          funnel_structure?: string | null
          id?: string
          landing_page_test_url?: string | null
          landing_page_url?: string | null
          offer_big_idea?: string | null
          personas?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_strategy_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          position: number | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_technical_setup: {
        Row: {
          ad_account_id: string | null
          ads_manager_link: string | null
          capi_status: string | null
          created_at: string | null
          drive_link: string | null
          id: string
          meta_pixel_id: string | null
          project_id: string
          tiktok_pixel_id: string | null
          updated_at: string | null
          utm_pattern: string | null
        }
        Insert: {
          ad_account_id?: string | null
          ads_manager_link?: string | null
          capi_status?: string | null
          created_at?: string | null
          drive_link?: string | null
          id?: string
          meta_pixel_id?: string | null
          project_id: string
          tiktok_pixel_id?: string | null
          updated_at?: string | null
          utm_pattern?: string | null
        }
        Update: {
          ad_account_id?: string | null
          ads_manager_link?: string | null
          capi_status?: string | null
          created_at?: string | null
          drive_link?: string | null
          id?: string
          meta_pixel_id?: string | null
          project_id?: string
          tiktok_pixel_id?: string | null
          updated_at?: string | null
          utm_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_technical_setup_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          created_at: string | null
          currency: string | null
          default_fields: Json | null
          default_tasks: Json | null
          default_value: number | null
          description: string | null
          id: string
          name: string
          project_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          default_fields?: Json | null
          default_tasks?: Json | null
          default_value?: number | null
          description?: string | null
          id?: string
          name: string
          project_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          default_fields?: Json | null
          default_tasks?: Json | null
          default_value?: number | null
          description?: string | null
          id?: string
          name?: string
          project_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_tests: {
        Row: {
          created_at: string | null
          hypothesis: string
          id: string
          learnings: string | null
          project_id: string
          result: string | null
          status: string | null
          updated_at: string | null
          variables: string | null
        }
        Insert: {
          created_at?: string | null
          hypothesis: string
          id?: string
          learnings?: string | null
          project_id: string
          result?: string | null
          status?: string | null
          updated_at?: string | null
          variables?: string | null
        }
        Update: {
          created_at?: string | null
          hypothesis?: string
          id?: string
          learnings?: string | null
          project_id?: string
          result?: string | null
          status?: string | null
          updated_at?: string | null
          variables?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          advance_payment: boolean | null
          advance_percentage: number | null
          cancelled_at: string | null
          carousel_creatives: number | null
          client_id: string | null
          created_at: string | null
          currency: string | null
          deadline: string | null
          id: string
          included_in_plan: boolean | null
          monthly_budget: number | null
          name: string
          project_type: string | null
          project_types: string[] | null
          share_enabled: boolean | null
          share_token: string | null
          static_creatives: number | null
          status: string | null
          target_cpa: number | null
          target_cpl: number | null
          target_roas: number | null
          total_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advance_payment?: boolean | null
          advance_percentage?: number | null
          cancelled_at?: string | null
          carousel_creatives?: number | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          id?: string
          included_in_plan?: boolean | null
          monthly_budget?: number | null
          name: string
          project_type?: string | null
          project_types?: string[] | null
          share_enabled?: boolean | null
          share_token?: string | null
          static_creatives?: number | null
          status?: string | null
          target_cpa?: number | null
          target_cpl?: number | null
          target_roas?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advance_payment?: boolean | null
          advance_percentage?: number | null
          cancelled_at?: string | null
          carousel_creatives?: number | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          deadline?: string | null
          id?: string
          included_in_plan?: boolean | null
          monthly_budget?: number | null
          name?: string
          project_type?: string | null
          project_types?: string[] | null
          share_enabled?: boolean | null
          share_token?: string | null
          static_creatives?: number | null
          status?: string | null
          target_cpa?: number | null
          target_cpl?: number | null
          target_roas?: number | null
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          accepted_at: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          id: string
          sent_at: string | null
          status: string | null
          title: string
          total_value: number | null
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          title: string
          total_value?: number | null
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          status?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_replies: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string
          id: string
          shortcut: string | null
          title: string
          use_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          shortcut?: string | null
          title: string
          use_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          shortcut?: string | null
          title?: string
          use_count?: number | null
        }
        Relationships: []
      }
      sales_pipeline: {
        Row: {
          ad_name: string | null
          adset_name: string | null
          asaas_customer_id: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_payment_status: string | null
          assigned_to: string | null
          campaign_name: string | null
          can_invest_250_day: string | null
          client_id: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string | null
          created_by: string
          facebook_lead_id: string | null
          form_name: string | null
          id: string
          instagram_handle: string | null
          invests_in_ads: string | null
          lead_arrived_at: string | null
          lost_at: string | null
          lost_reason: string | null
          main_challenge: string | null
          monthly_revenue: string | null
          notes: string | null
          payment_link: string | null
          payment_order_id: string | null
          payment_status: string | null
          platform: string | null
          source: string | null
          stage: string | null
          store_segment: string | null
          title: string
          updated_at: string | null
          uses_ai_automation: string | null
          value: number | null
          won_at: string | null
        }
        Insert: {
          ad_name?: string | null
          adset_name?: string | null
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_payment_status?: string | null
          assigned_to?: string | null
          campaign_name?: string | null
          can_invest_250_day?: string | null
          client_id?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string | null
          created_by: string
          facebook_lead_id?: string | null
          form_name?: string | null
          id?: string
          instagram_handle?: string | null
          invests_in_ads?: string | null
          lead_arrived_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          main_challenge?: string | null
          monthly_revenue?: string | null
          notes?: string | null
          payment_link?: string | null
          payment_order_id?: string | null
          payment_status?: string | null
          platform?: string | null
          source?: string | null
          stage?: string | null
          store_segment?: string | null
          title: string
          updated_at?: string | null
          uses_ai_automation?: string | null
          value?: number | null
          won_at?: string | null
        }
        Update: {
          ad_name?: string | null
          adset_name?: string | null
          asaas_customer_id?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_payment_status?: string | null
          assigned_to?: string | null
          campaign_name?: string | null
          can_invest_250_day?: string | null
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string
          facebook_lead_id?: string | null
          form_name?: string | null
          id?: string
          instagram_handle?: string | null
          invests_in_ads?: string | null
          lead_arrived_at?: string | null
          lost_at?: string | null
          lost_reason?: string | null
          main_challenge?: string | null
          monthly_revenue?: string | null
          notes?: string | null
          payment_link?: string | null
          payment_order_id?: string | null
          payment_status?: string | null
          platform?: string | null
          source?: string | null
          stage?: string | null
          store_segment?: string | null
          title?: string
          updated_at?: string | null
          uses_ai_automation?: string | null
          value?: number | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_pipeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          frequency: string
          id: string
          last_sent_at: string | null
          next_send_at: string | null
          recipients: string[] | null
          report_type: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients?: string[] | null
          report_type: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string
          id?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          recipients?: string[] | null
          report_type?: string
          user_id?: string
        }
        Relationships: []
      }
      signatories: {
        Row: {
          contract_id: string
          created_at: string | null
          email: string
          id: string
          name: string
          role: string | null
          signed_at: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
          signed_at?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signatories_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_checklist_items: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          position: number | null
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          position?: number | null
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          position?: number | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_label_assignments: {
        Row: {
          created_at: string | null
          id: string
          label_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "task_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_label_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_labels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      team_goals: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          month: string
          revenue_goal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          month: string
          revenue_goal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          month?: string
          revenue_goal?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
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
      visitas: {
        Row: {
          confirmada: boolean | null
          created_at: string | null
          data_hora: string | null
          id: string
          lead_id: string | null
          loja_id: string | null
        }
        Insert: {
          confirmada?: boolean | null
          created_at?: string | null
          data_hora?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
        }
        Update: {
          confirmada?: boolean | null
          created_at?: string | null
          data_hora?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_leads: {
        Row: {
          created_at: string | null
          email: string | null
          extra_data: Json | null
          facebook_lead_id: string | null
          id: string
          imported: boolean | null
          message: string | null
          name: string
          phone: string | null
          pipeline_item_id: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          extra_data?: Json | null
          facebook_lead_id?: string | null
          id?: string
          imported?: boolean | null
          message?: string | null
          name: string
          phone?: string | null
          pipeline_item_id?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          extra_data?: Json | null
          facebook_lead_id?: string | null
          id?: string
          imported?: boolean | null
          message?: string | null
          name?: string
          phone?: string | null
          pipeline_item_id?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_leads_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "sales_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contact_notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_contacts: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          name: string | null
          notes: string | null
          phone: string
          profile_pic_url: string | null
          source: string | null
          tags: string[] | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone: string
          profile_pic_url?: string | null
          source?: string | null
          tags?: string[] | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string
          profile_pic_url?: string | null
          source?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      whatsapp_conversation_tags: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          tag_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_tags_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversation_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          ai_summary: string | null
          ai_summary_at: string | null
          assigned_to: string | null
          bot_paused_until: string | null
          contact_id: string
          created_at: string | null
          handoff: boolean | null
          handoff_area: string | null
          id: string
          instance_id: string
          is_bot_active: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          resolution_reason: string | null
          resolved_at: string | null
          status: string | null
          unread_count: number | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          assigned_to?: string | null
          bot_paused_until?: string | null
          contact_id: string
          created_at?: string | null
          handoff?: boolean | null
          handoff_area?: string | null
          id?: string
          instance_id: string
          is_bot_active?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          ai_summary_at?: string | null
          assigned_to?: string | null
          bot_paused_until?: string | null
          contact_id?: string
          created_at?: string | null
          handoff?: boolean | null
          handoff_area?: string | null
          id?: string
          instance_id?: string
          is_bot_active?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          resolution_reason?: string | null
          resolved_at?: string | null
          status?: string | null
          unread_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          api_key: string
          api_url: string
          created_at: string | null
          created_by: string
          id: string
          instance_name: string
          name: string
          status: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string | null
          created_by: string
          id?: string
          instance_name: string
          name: string
          status?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string | null
          created_by?: string
          id?: string
          instance_name?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          external_id: string | null
          file_name: string | null
          id: string
          media_type: string | null
          media_url: string | null
          sender_type: string
          sent_by: string | null
          status: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          external_id?: string | null
          file_name?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_type?: string
          sent_by?: string | null
          status?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          external_id?: string | null
          file_name?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          sender_type?: string
          sent_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_cliente_atendimento: {
        Args: {
          p_access_key?: string
          p_document?: string
          p_phone_digits?: string
        }
        Returns: Json
      }
      checar_bot_ativo: { Args: { p_phone: string }; Returns: Json }
      delete_client_safely: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_new_data?: string
          p_old_data?: string
          p_record_id?: string
          p_table?: string
        }
        Returns: undefined
      }
      match_produtos: {
        Args: {
          loja_id_param?: string
          match_count?: number
          match_threshold?: number
          query_embedding: Json
        }
        Returns: {
          descricao: string
          estoque_disponivel: boolean
          foto_principal: string
          id: string
          nome: string
          preco_original: number
          preco_promocional: number
          similarity: number
          video_url: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "director"
        | "team_leader"
        | "user"
        | "designer"
        | "copywriter"
        | "traffic_manager"
        | "social_media"
        | "programmer"
        | "sdr"
        | "closer"
        | "video_editor"
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
        "admin",
        "director",
        "team_leader",
        "user",
        "designer",
        "copywriter",
        "traffic_manager",
        "social_media",
        "programmer",
        "sdr",
        "closer",
        "video_editor",
      ],
    },
  },
} as const
