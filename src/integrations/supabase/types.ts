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
      appointments: {
        Row: {
          clinic_id: string
          created_at: string
          date: string
          duration_minutes: number
          id: string
          notes: string | null
          patient_id: string
          procedure_id: string | null
          professional_name: string | null
          status: string
          time: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          date: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id: string
          procedure_id?: string | null
          professional_name?: string | null
          status?: string
          time?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          date?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_id?: string
          procedure_id?: string | null
          professional_name?: string | null
          status?: string
          time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          clinic_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          table_name: string
          user_email: string | null
        }
        Insert: {
          action: string
          clinic_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          table_name: string
          user_email?: string | null
        }
        Update: {
          action?: string
          clinic_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          table_name?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          active: boolean
          clinic_id: string
          created_at: string
          delay_days: number
          id: string
          message_template: string | null
          name: string
          trigger_event: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          clinic_id: string
          created_at?: string
          delay_days?: number
          id?: string
          message_template?: string | null
          name: string
          trigger_event: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          clinic_id?: string
          created_at?: string
          delay_days?: number
          id?: string
          message_template?: string | null
          name?: string
          trigger_event?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          clinic_id: string
          created_at: string
          discount: number
          id: string
          installments: number
          notes: string | null
          patient_id: string
          payment_method: string | null
          status: string
          total: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          discount?: number
          id?: string
          installments?: number
          notes?: string | null
          patient_id: string
          payment_method?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          discount?: number
          id?: string
          installments?: number
          notes?: string | null
          patient_id?: string
          payment_method?: string | null
          status?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_integrations: {
        Row: {
          clinic_id: string
          config: Json
          created_at: string
          id: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          config?: Json
          created_at?: string
          id?: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          config?: Json
          created_at?: string
          id?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_integrations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          city: string | null
          clinic_subtitle: string | null
          created_at: string
          email: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          notes: string | null
          owner_email: string
          owner_name: string
          phone: string | null
          primary_color: string | null
          state: string | null
          status: Database["public"]["Enums"]["clinic_status"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          clinic_subtitle?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          notes?: string | null
          owner_email: string
          owner_name: string
          phone?: string | null
          primary_color?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          clinic_subtitle?: string | null
          created_at?: string
          email?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          notes?: string | null
          owner_email?: string
          owner_name?: string
          phone?: string | null
          primary_color?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["clinic_status"]
          updated_at?: string
        }
        Relationships: []
      }
      consent_terms: {
        Row: {
          active: boolean
          clinic_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          clinic_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          clinic_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "consent_terms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_webhook_events: {
        Row: {
          created_at: string
          erro: string | null
          event_id: string | null
          headers: Json | null
          id: string
          loja_id: string
          payload_original: Json | null
          plataforma: string
          processado: boolean
          topico: string
          triggered_at: string | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string
          erro?: string | null
          event_id?: string | null
          headers?: Json | null
          id?: string
          loja_id: string
          payload_original?: Json | null
          plataforma: string
          processado?: boolean
          topico: string
          triggered_at?: string | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string
          erro?: string | null
          event_id?: string | null
          headers?: Json | null
          id?: string
          loja_id?: string
          payload_original?: Json | null
          plataforma?: string
          processado?: boolean
          topico?: string
          triggered_at?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecommerce_webhook_events_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          created_at: string
          id: string
          loja_id: string
          origem: string
          produto_id: string
          quantidade_anterior: number
          quantidade_movimentada: number
          quantidade_nova: number
          referencia_id: string | null
          source_updated_at: string | null
          variacao_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          loja_id: string
          origem: string
          produto_id: string
          quantidade_anterior?: number
          quantidade_movimentada?: number
          quantidade_nova?: number
          referencia_id?: string | null
          source_updated_at?: string | null
          variacao_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          loja_id?: string
          origem?: string
          produto_id?: string
          quantidade_anterior?: number
          quantidade_movimentada?: number
          quantidade_nova?: number
          referencia_id?: string | null
          source_updated_at?: string | null
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_ia"
            referencedColumns: ["produto_id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "produto_variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_ia"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      financial_installments: {
        Row: {
          amount: number
          budget_id: string | null
          clinic_id: string
          created_at: string
          due_date: string | null
          id: string
          paid_at: string | null
          patient_id: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          budget_id?: string | null
          clinic_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          budget_id?: string | null
          clinic_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_installments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_installments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_installments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          agendado_para: string
          campaign_id: string | null
          created_at: string
          enviado: boolean
          enviado_em: string | null
          erro_envio: string | null
          id: string
          lead_id: string | null
          loja_id: string
          mensagem: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          agendado_para: string
          campaign_id?: string | null
          created_at?: string
          enviado?: boolean
          enviado_em?: string | null
          erro_envio?: string | null
          id?: string
          lead_id?: string | null
          loja_id: string
          mensagem?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          agendado_para?: string
          campaign_id?: string | null
          created_at?: string
          enviado?: boolean
          enviado_em?: string | null
          erro_envio?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string
          mensagem?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
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
          created_at: string
          id: string
          lead_id: string | null
          loja_id: string
          message_id: string | null
          role: string
          telefone: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id?: string | null
          loja_id: string
          message_id?: string | null
          role: string
          telefone: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          loja_id?: string
          message_id?: string | null
          role?: string
          telefone?: string
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
      juliana_crisis_log: {
        Row: {
          client_phone: string
          created_at: string
          crisis_type: string
          id: string
          message_received: string | null
          resolved: boolean
          response_sent: string | null
          routed_to: string | null
        }
        Insert: {
          client_phone: string
          created_at?: string
          crisis_type?: string
          id?: string
          message_received?: string | null
          resolved?: boolean
          response_sent?: string | null
          routed_to?: string | null
        }
        Update: {
          client_phone?: string
          created_at?: string
          crisis_type?: string
          id?: string
          message_received?: string | null
          resolved?: boolean
          response_sent?: string | null
          routed_to?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          agente_pausado: boolean | null
          bot_paused_until: string | null
          canal_origem: string | null
          created_at: string
          email: string | null
          etapa_pipeline: string
          followup_etapa: number | null
          id: string
          instance: string | null
          interesse: string | null
          is_bot_active: boolean
          lead_score: number | null
          loja_id: string
          motivo_risco: string | null
          nome: string | null
          nps_comentario: string | null
          nps_score: number | null
          orcamento_faixa: string | null
          origem: string | null
          pos_venda_status: string | null
          produtos_consultados: Json | null
          risco_perda: string | null
          sentimento_atual: string | null
          sentimento_historico: Json | null
          telefone: string
          ultima_interacao: string | null
          ultima_mensagem: string | null
          updated_at: string
        }
        Insert: {
          agente_pausado?: boolean | null
          bot_paused_until?: string | null
          canal_origem?: string | null
          created_at?: string
          email?: string | null
          etapa_pipeline?: string
          followup_etapa?: number | null
          id?: string
          instance?: string | null
          interesse?: string | null
          is_bot_active?: boolean
          lead_score?: number | null
          loja_id: string
          motivo_risco?: string | null
          nome?: string | null
          nps_comentario?: string | null
          nps_score?: number | null
          orcamento_faixa?: string | null
          origem?: string | null
          pos_venda_status?: string | null
          produtos_consultados?: Json | null
          risco_perda?: string | null
          sentimento_atual?: string | null
          sentimento_historico?: Json | null
          telefone: string
          ultima_interacao?: string | null
          ultima_mensagem?: string | null
          updated_at?: string
        }
        Update: {
          agente_pausado?: boolean | null
          bot_paused_until?: string | null
          canal_origem?: string | null
          created_at?: string
          email?: string | null
          etapa_pipeline?: string
          followup_etapa?: number | null
          id?: string
          instance?: string | null
          interesse?: string | null
          is_bot_active?: boolean
          lead_score?: number | null
          loja_id?: string
          motivo_risco?: string | null
          nome?: string | null
          nps_comentario?: string | null
          nps_score?: number | null
          orcamento_faixa?: string | null
          origem?: string | null
          pos_venda_status?: string | null
          produtos_consultados?: Json | null
          risco_perda?: string | null
          sentimento_atual?: string | null
          sentimento_historico?: Json | null
          telefone?: string
          ultima_interacao?: string | null
          ultima_mensagem?: string | null
          updated_at?: string
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
          ativo: boolean
          checkout_base_url: string | null
          clinic_id: string | null
          created_at: string
          desconto_carrinho_abandonado: number | null
          desconto_followup_orcamento: number | null
          desconto_promocao_nao_respondida: number | null
          descricao_loja: string | null
          dias_funcionamento: string | null
          ecommerce_access_token: string | null
          ecommerce_store_id: string | null
          endereco: string | null
          especialidades: string | null
          external_id: string | null
          formas_pagamento: string | null
          frete_gratis_acima: number | null
          horario_fim: string | null
          horario_inicio: string | null
          horarios_especiais: Json | null
          id: string
          instance: string | null
          maps_link: string | null
          montagem_disponivel: boolean
          msg_fora_horario: string | null
          nome_assistente_ia: string | null
          nome_loja: string
          onboarding_concluido: boolean | null
          plataforma_ecommerce: string | null
          politica_troca: string | null
          prazo_entrega: string | null
          regras_personalidade: string | null
          sync_job_id: string | null
          tom_voz: string | null
          ultima_sync_catalogo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          checkout_base_url?: string | null
          clinic_id?: string | null
          created_at?: string
          desconto_carrinho_abandonado?: number | null
          desconto_followup_orcamento?: number | null
          desconto_promocao_nao_respondida?: number | null
          descricao_loja?: string | null
          dias_funcionamento?: string | null
          ecommerce_access_token?: string | null
          ecommerce_store_id?: string | null
          endereco?: string | null
          especialidades?: string | null
          external_id?: string | null
          formas_pagamento?: string | null
          frete_gratis_acima?: number | null
          horario_fim?: string | null
          horario_inicio?: string | null
          horarios_especiais?: Json | null
          id?: string
          instance?: string | null
          maps_link?: string | null
          montagem_disponivel?: boolean
          msg_fora_horario?: string | null
          nome_assistente_ia?: string | null
          nome_loja: string
          onboarding_concluido?: boolean | null
          plataforma_ecommerce?: string | null
          politica_troca?: string | null
          prazo_entrega?: string | null
          regras_personalidade?: string | null
          sync_job_id?: string | null
          tom_voz?: string | null
          ultima_sync_catalogo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          checkout_base_url?: string | null
          clinic_id?: string | null
          created_at?: string
          desconto_carrinho_abandonado?: number | null
          desconto_followup_orcamento?: number | null
          desconto_promocao_nao_respondida?: number | null
          descricao_loja?: string | null
          dias_funcionamento?: string | null
          ecommerce_access_token?: string | null
          ecommerce_store_id?: string | null
          endereco?: string | null
          especialidades?: string | null
          external_id?: string | null
          formas_pagamento?: string | null
          frete_gratis_acima?: number | null
          horario_fim?: string | null
          horario_inicio?: string | null
          horarios_especiais?: Json | null
          id?: string
          instance?: string | null
          maps_link?: string | null
          montagem_disponivel?: boolean
          msg_fora_horario?: string | null
          nome_assistente_ia?: string | null
          nome_loja?: string
          onboarding_concluido?: boolean | null
          plataforma_ecommerce?: string | null
          politica_troca?: string | null
          prazo_entrega?: string | null
          regras_personalidade?: string | null
          sync_job_id?: string | null
          tom_voz?: string | null
          ultima_sync_catalogo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lojas_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_processadas: {
        Row: {
          created_at: string | null
          instance: string | null
          message_id: string
          remotejid: string | null
        }
        Insert: {
          created_at?: string | null
          instance?: string | null
          message_id: string
          remotejid?: string | null
        }
        Update: {
          created_at?: string | null
          instance?: string | null
          message_id?: string
          remotejid?: string | null
        }
        Relationships: []
      }
      midias_enviadas: {
        Row: {
          created_at: string
          enviado_em: string
          id: string
          lead_id: string | null
          legenda: string | null
          loja_id: string | null
          produto_id: string | null
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          enviado_em?: string
          id?: string
          lead_id?: string | null
          legenda?: string | null
          loja_id?: string | null
          produto_id?: string | null
          tipo?: string
          url: string
        }
        Update: {
          created_at?: string
          enviado_em?: string
          id?: string
          lead_id?: string | null
          legenda?: string | null
          loja_id?: string | null
          produto_id?: string | null
          tipo?: string
          url?: string
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
          {
            foreignKeyName: "midias_enviadas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_ia"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      nps_responses: {
        Row: {
          clinic_id: string
          comment: string | null
          created_at: string
          id: string
          lead_id: string | null
          loja_id: string | null
          patient_id: string | null
          score: number
        }
        Insert: {
          clinic_id: string
          comment?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          patient_id?: string | null
          score: number
        }
        Update: {
          clinic_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          patient_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "nps_responses_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_responses_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          clinic_id: string
          consent_type: string
          consented: boolean
          consented_at: string
          created_at: string
          id: string
          patient_id: string
          revoked_at: string | null
        }
        Insert: {
          clinic_id: string
          consent_type?: string
          consented?: boolean
          consented_at?: string
          created_at?: string
          id?: string
          patient_id: string
          revoked_at?: string | null
        }
        Update: {
          clinic_id?: string
          consent_type?: string
          consented?: boolean
          consented_at?: string
          created_at?: string
          id?: string
          patient_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          clinic_id: string
          cpf: string | null
          created_at: string
          email: string | null
          gender: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          stage: string
          tags: string[]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          birth_date?: string | null
          clinic_id: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string
          tags?: string[]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          birth_date?: string | null
          clinic_id?: string
          cpf?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string
          tags?: string[]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          created_at: string
          id: string
          nome: string
          pedido_id: string
          preco_unitario: number
          produto_external_id: string | null
          produto_id: string | null
          quantidade: number
          sku: string | null
          subtotal: number
          variacao_external_id: string | null
          variacao_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          pedido_id: string
          preco_unitario?: number
          produto_external_id?: string | null
          produto_id?: string | null
          quantidade?: number
          sku?: string | null
          subtotal?: number
          variacao_external_id?: string | null
          variacao_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          pedido_id?: string
          preco_unitario?: number
          produto_external_id?: string | null
          produto_id?: string | null
          quantidade?: number
          sku?: string | null
          subtotal?: number
          variacao_external_id?: string | null
          variacao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_ia"
            referencedColumns: ["produto_id"]
          },
          {
            foreignKeyName: "pedido_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "produto_variacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_variacao_id_fkey"
            columns: ["variacao_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_ia"
            referencedColumns: ["variacao_id"]
          },
        ]
      }
      pedidos: {
        Row: {
          canal: string | null
          created_at: string
          customer_email: string | null
          customer_nome: string | null
          customer_telefone: string | null
          desconto: number | null
          external_id: string | null
          frete: number | null
          id: string
          lead_id: string | null
          loja_id: string
          moeda: string | null
          notas: string | null
          payload_original: Json | null
          plataforma: string | null
          source_updated_at: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          canal?: string | null
          created_at?: string
          customer_email?: string | null
          customer_nome?: string | null
          customer_telefone?: string | null
          desconto?: number | null
          external_id?: string | null
          frete?: number | null
          id?: string
          lead_id?: string | null
          loja_id: string
          moeda?: string | null
          notas?: string | null
          payload_original?: Json | null
          plataforma?: string | null
          source_updated_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          canal?: string | null
          created_at?: string
          customer_email?: string | null
          customer_nome?: string | null
          customer_telefone?: string | null
          desconto?: number | null
          external_id?: string | null
          frete?: number | null
          id?: string
          lead_id?: string | null
          loja_id?: string
          moeda?: string | null
          notas?: string | null
          payload_original?: Json | null
          plataforma?: string | null
          source_updated_at?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      post_procedure_templates: {
        Row: {
          active: boolean
          clinic_id: string
          created_at: string
          delay_hours: number
          id: string
          message_template: string
          name: string
          procedure_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          clinic_id: string
          created_at?: string
          delay_hours?: number
          id?: string
          message_template: string
          name: string
          procedure_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          clinic_id?: string
          created_at?: string
          delay_hours?: number
          id?: string
          message_template?: string
          name?: string
          procedure_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_procedure_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_procedure_templates_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      post_sale_contacts: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          loja_id: string
          sent_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          loja_id: string
          sent_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          loja_id?: string
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_sale_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_sale_contacts_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          active: boolean
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedures_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      product_complements: {
        Row: {
          categoria_complementar: string
          categoria_origem: string
          created_at: string | null
          id: string
          loja_id: string | null
          prioridade: number | null
        }
        Insert: {
          categoria_complementar: string
          categoria_origem: string
          created_at?: string | null
          id?: string
          loja_id?: string | null
          prioridade?: number | null
        }
        Update: {
          categoria_complementar?: string
          categoria_origem?: string
          created_at?: string | null
          id?: string
          loja_id?: string | null
          prioridade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_complements_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      produto_variacoes: {
        Row: {
          ativo: boolean
          atributos: Json | null
          checkout_url: string | null
          created_at: string
          estoque: number
          estoque_disponivel: boolean
          external_id: string | null
          id: string
          imagem_url: string | null
          inventory_item_id: string | null
          loja_id: string
          nome: string
          posicao: number | null
          preco: number | null
          preco_promocional: number | null
          produto_id: string
          sku: string | null
          source_updated_at: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          atributos?: Json | null
          checkout_url?: string | null
          created_at?: string
          estoque?: number
          estoque_disponivel?: boolean
          external_id?: string | null
          id?: string
          imagem_url?: string | null
          inventory_item_id?: string | null
          loja_id: string
          nome: string
          posicao?: number | null
          preco?: number | null
          preco_promocional?: number | null
          produto_id: string
          sku?: string | null
          source_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          atributos?: Json | null
          checkout_url?: string | null
          created_at?: string
          estoque?: number
          estoque_disponivel?: boolean
          external_id?: string | null
          id?: string
          imagem_url?: string | null
          inventory_item_id?: string | null
          loja_id?: string
          nome?: string
          posicao?: number | null
          preco?: number | null
          preco_promocional?: number | null
          produto_id?: string
          sku?: string | null
          source_updated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produto_variacoes_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_variacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produto_variacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_ia"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string | null
          checkout_url: string | null
          created_at: string
          descricao: string | null
          embedding: string | null
          especificacoes: string | null
          estoque: number | null
          estoque_disponivel: boolean
          external_id: string | null
          foto_detalhe: string | null
          foto_principal: string | null
          id: string
          loja_id: string
          nome: string
          payload_original: Json | null
          plataforma: string | null
          preco_original: number
          preco_promocional: number | null
          sku: string | null
          source_updated_at: string | null
          tags: string | null
          updated_at: string
          variacoes: Json | null
          video_url: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          checkout_url?: string | null
          created_at?: string
          descricao?: string | null
          embedding?: string | null
          especificacoes?: string | null
          estoque?: number | null
          estoque_disponivel?: boolean
          external_id?: string | null
          foto_detalhe?: string | null
          foto_principal?: string | null
          id?: string
          loja_id: string
          nome: string
          payload_original?: Json | null
          plataforma?: string | null
          preco_original?: number
          preco_promocional?: number | null
          sku?: string | null
          source_updated_at?: string | null
          tags?: string | null
          updated_at?: string
          variacoes?: Json | null
          video_url?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          checkout_url?: string | null
          created_at?: string
          descricao?: string | null
          embedding?: string | null
          especificacoes?: string | null
          estoque?: number | null
          estoque_disponivel?: boolean
          external_id?: string | null
          foto_detalhe?: string | null
          foto_principal?: string | null
          id?: string
          loja_id?: string
          nome?: string
          payload_original?: Json | null
          plataforma?: string | null
          preco_original?: number
          preco_promocional?: number | null
          sku?: string | null
          source_updated_at?: string | null
          tags?: string | null
          updated_at?: string
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
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotional_campaigns: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          launched_at: string
          loja_id: string
          message_template: string
          name: string
          segment_config: Json
          segment_type: string
          status: string
          targeted_leads_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          launched_at?: string
          loja_id: string
          message_template: string
          name: string
          segment_config?: Json
          segment_type: string
          status?: string
          targeted_leads_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          launched_at?: string
          loja_id?: string
          message_template?: string
          name?: string
          segment_config?: Json
          segment_type?: string
          status?: string
          targeted_leads_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotional_campaigns_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_goals: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          period: string
          professional_name: string | null
          target_amount: number
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          period: string
          professional_name?: string | null
          target_amount?: number
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          period?: string
          professional_name?: string | null
          target_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_goals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_jobs: {
        Row: {
          created_at: string
          erros: Json | null
          finished_at: string | null
          forcar_reimportacao: boolean | null
          id: string
          loja_id: string
          modo: string
          plataforma: string
          solicitado_por: string | null
          started_at: string | null
          status: string
          total_atualizados: number | null
          total_criados: number | null
          total_erros: number | null
          total_lidos: number | null
          total_variacoes: number | null
        }
        Insert: {
          created_at?: string
          erros?: Json | null
          finished_at?: string | null
          forcar_reimportacao?: boolean | null
          id?: string
          loja_id: string
          modo?: string
          plataforma: string
          solicitado_por?: string | null
          started_at?: string | null
          status?: string
          total_atualizados?: number | null
          total_criados?: number | null
          total_erros?: number | null
          total_lidos?: number | null
          total_variacoes?: number | null
        }
        Update: {
          created_at?: string
          erros?: Json | null
          finished_at?: string | null
          forcar_reimportacao?: boolean | null
          id?: string
          loja_id?: string
          modo?: string
          plataforma?: string
          solicitado_por?: string | null
          started_at?: string | null
          status?: string
          total_atualizados?: number | null
          total_criados?: number | null
          total_erros?: number | null
          total_lidos?: number | null
          total_variacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_jobs_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          checkout_url: string | null
          created_at: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          loja_id: string | null
          produto_id: string | null
          status: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          checkout_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          produto_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          checkout_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          loja_id?: string | null
          produto_id?: string | null
          status?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "vw_catalogo_ia"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      visitas: {
        Row: {
          created_at: string
          data_visita: string
          id: string
          lead_id: string | null
          loja_id: string
          observacoes: string | null
          produtos_interesse: string | null
          status: Database["public"]["Enums"]["visita_status"]
          updated_at: string
          vendedor_responsavel: string | null
        }
        Insert: {
          created_at?: string
          data_visita: string
          id?: string
          lead_id?: string | null
          loja_id: string
          observacoes?: string | null
          produtos_interesse?: string | null
          status?: Database["public"]["Enums"]["visita_status"]
          updated_at?: string
          vendedor_responsavel?: string | null
        }
        Update: {
          created_at?: string
          data_visita?: string
          id?: string
          lead_id?: string | null
          loja_id?: string
          observacoes?: string | null
          produtos_interesse?: string | null
          status?: Database["public"]["Enums"]["visita_status"]
          updated_at?: string
          vendedor_responsavel?: string | null
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
    }
    Views: {
      vw_catalogo_ia: {
        Row: {
          atributos: Json | null
          categoria: string | null
          checkout_url: string | null
          descricao: string | null
          estoque: number | null
          estoque_disponivel: boolean | null
          imagem_url: string | null
          loja_id: string | null
          nome_exibicao: string | null
          nome_produto: string | null
          nome_variacao: string | null
          plataforma: string | null
          preco: number | null
          preco_promocional: number | null
          produto_ativo: boolean | null
          produto_external_id: string | null
          produto_id: string | null
          produto_source_updated_at: string | null
          sku: string | null
          tags: string | null
          variacao_ativa: boolean | null
          variacao_external_id: string | null
          variacao_id: string | null
          variacao_source_updated_at: string | null
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
    }
    Functions: {
      calculate_lead_score: { Args: { _loja_id?: string }; Returns: undefined }
      decrementar_estoque: {
        Args: {
          p_produto_id: string
          p_quantidade?: number
          p_referencia_id?: string
          p_variacao_id?: string
        }
        Returns: Json
      }
      fn_ecommerce_import_produto: {
        Args: {
          p_categoria?: string
          p_checkout_url?: string
          p_descricao?: string
          p_estoque?: number
          p_external_id: string
          p_foto_principal?: string
          p_loja_id: string
          p_nome: string
          p_plataforma: string
          p_preco_original?: number
          p_preco_promocional?: number
          p_sku?: string
          p_variacoes?: Json
        }
        Returns: Json
      }
      fn_ecommerce_order_process: {
        Args: {
          p_acao_estoque?: string
          p_canal?: string
          p_customer_email?: string
          p_customer_nome?: string
          p_customer_telefone?: string
          p_desconto?: number
          p_event_id: string
          p_external_id?: string
          p_frete?: number
          p_headers?: Json
          p_itens?: Json
          p_loja_id: string
          p_moeda?: string
          p_notas?: string
          p_numero_pedido?: string
          p_payload_original?: Json
          p_plataforma: string
          p_source_created_at?: string
          p_source_updated_at?: string
          p_status?: string
          p_subtotal?: number
          p_topico: string
          p_total?: number
        }
        Returns: Json
      }
      fn_ecommerce_webhook_process: {
        Args: {
          p_categoria?: string
          p_checkout_url?: string
          p_descricao?: string
          p_estoque?: number
          p_event_id?: string
          p_external_id?: string
          p_foto_principal?: string
          p_headers?: Json
          p_loja_id: string
          p_nome?: string
          p_payload_original?: Json
          p_plataforma: string
          p_preco_original?: number
          p_preco_promocional?: number
          p_sku?: string
          p_topico?: string
          p_variacoes?: Json
        }
        Returns: Json
      }
      get_cross_sell_products: {
        Args: { _lead_id: string; _limit?: number; _loja_id: string }
        Returns: {
          categoria: string
          checkout_url: string
          foto_principal: string
          motivo_sugestao: string
          nome: string
          preco_original: number
          preco_promocional: number
          produto_id: string
        }[]
      }
      has_clinic_access: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
      has_loja_access: {
        Args: { _loja_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ia_catalogo_buscar: {
        Args: { params: Json }
        Returns: {
          atributos: Json | null
          categoria: string | null
          checkout_url: string | null
          descricao: string | null
          estoque: number | null
          estoque_disponivel: boolean | null
          imagem_url: string | null
          loja_id: string | null
          nome_exibicao: string | null
          nome_produto: string | null
          nome_variacao: string | null
          plataforma: string | null
          preco: number | null
          preco_promocional: number | null
          produto_ativo: boolean | null
          produto_external_id: string | null
          produto_id: string | null
          produto_source_updated_at: string | null
          sku: string | null
          tags: string | null
          variacao_ativa: boolean | null
          variacao_external_id: string | null
          variacao_id: string | null
          variacao_source_updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "vw_catalogo_ia"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      match_produtos: {
        Args: {
          loja_id_param: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          checkout_url: string
          descricao: string
          estoque_disponivel: boolean
          foto_principal: string
          id: string
          nome: string
          preco_original: number
          preco_promocional: number
          similarity: number
        }[]
      }
      recompor_estoque: {
        Args: {
          p_produto_id: string
          p_quantidade?: number
          p_referencia_id?: string
          p_variacao_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "platform_admin"
        | "clinic_owner"
        | "clinic_staff"
        | "clinic_receptionist"
      clinic_status: "ativa" | "inativa" | "cancelada"
      lead_stage:
        | "novo"
        | "qualificado"
        | "orcamento"
        | "negociacao"
        | "fechado_ganho"
        | "fechado_perdido"
      visita_status: "agendada" | "confirmada" | "realizada" | "cancelada"
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
        "platform_admin",
        "clinic_owner",
        "clinic_staff",
        "clinic_receptionist",
      ],
      clinic_status: ["ativa", "inativa", "cancelada"],
      lead_stage: [
        "novo",
        "qualificado",
        "orcamento",
        "negociacao",
        "fechado_ganho",
        "fechado_perdido",
      ],
      visita_status: ["agendada", "confirmada", "realizada", "cancelada"],
    },
  },
} as const
