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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agt_config: {
        Row: {
          actividade_comercial: string | null
          alvara_comercial: string | null
          auto_send_invoice: boolean | null
          certificate_number: string | null
          certificate_status: string | null
          certificate_valid_until: string | null
          cidade: string | null
          created_at: string
          declaracao_conformidade_reference: string | null
          default_send_channel:
            | Database["public"]["Enums"]["send_channel"]
            | null
          email: string | null
          endereco_empresa: string | null
          id: string
          invoice_language: string | null
          logo_url: string | null
          memoria_descritiva_reference: string | null
          modelo_8_reference: string | null
          morada: string | null
          nif_produtor: string | null
          nome_empresa: string | null
          provincia: string | null
          public_key: string | null
          telefone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          actividade_comercial?: string | null
          alvara_comercial?: string | null
          auto_send_invoice?: boolean | null
          certificate_number?: string | null
          certificate_status?: string | null
          certificate_valid_until?: string | null
          cidade?: string | null
          created_at?: string
          declaracao_conformidade_reference?: string | null
          default_send_channel?:
            | Database["public"]["Enums"]["send_channel"]
            | null
          email?: string | null
          endereco_empresa?: string | null
          id?: string
          invoice_language?: string | null
          logo_url?: string | null
          memoria_descritiva_reference?: string | null
          modelo_8_reference?: string | null
          morada?: string | null
          nif_produtor?: string | null
          nome_empresa?: string | null
          provincia?: string | null
          public_key?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          actividade_comercial?: string | null
          alvara_comercial?: string | null
          auto_send_invoice?: boolean | null
          certificate_number?: string | null
          certificate_status?: string | null
          certificate_valid_until?: string | null
          cidade?: string | null
          created_at?: string
          declaracao_conformidade_reference?: string | null
          default_send_channel?:
            | Database["public"]["Enums"]["send_channel"]
            | null
          email?: string | null
          endereco_empresa?: string | null
          id?: string
          invoice_language?: string | null
          logo_url?: string | null
          memoria_descritiva_reference?: string | null
          modelo_8_reference?: string | null
          morada?: string | null
          nif_produtor?: string | null
          nome_empresa?: string | null
          provincia?: string | null
          public_key?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          created_at: string
          email: string | null
          endereco: string
          id: string
          nif: string
          nome: string
          telefone: string | null
          tipo: string
          updated_at: string
          user_id: string
          whatsapp_consent: boolean
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco: string
          id?: string
          nif: string
          nome: string
          telefone?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          whatsapp_consent?: boolean
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco?: string
          id?: string
          nif?: string
          nome?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          whatsapp_consent?: boolean
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      document_signatures: {
        Row: {
          certificate_number: string | null
          document_hash: string
          fatura_id: string
          id: string
          signature_algorithm: string | null
          signature_hash: string
          signed_at: string
        }
        Insert: {
          certificate_number?: string | null
          document_hash: string
          fatura_id: string
          id?: string
          signature_algorithm?: string | null
          signature_hash: string
          signed_at?: string
        }
        Update: {
          certificate_number?: string | null
          document_hash?: string
          fatura_id?: string
          id?: string
          signature_algorithm?: string | null
          signature_hash?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: true
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      faturas: {
        Row: {
          assinatura_digital: string | null
          certificate_number: string | null
          cliente_id: string
          created_at: string
          data_emissao: string
          data_pagamento: string | null
          data_vencimento: string
          estado: string
          id: string
          is_locked: boolean | null
          metodo_pagamento: string | null
          numero: string
          observacoes: string | null
          qr_code: string | null
          referencia_pagamento: string | null
          serie: string
          signature_hash: string | null
          subtotal: number
          tipo: string
          total: number
          total_iva: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assinatura_digital?: string | null
          certificate_number?: string | null
          cliente_id: string
          created_at?: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento: string
          estado?: string
          id?: string
          is_locked?: boolean | null
          metodo_pagamento?: string | null
          numero: string
          observacoes?: string | null
          qr_code?: string | null
          referencia_pagamento?: string | null
          serie?: string
          signature_hash?: string | null
          subtotal?: number
          tipo: string
          total?: number
          total_iva?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assinatura_digital?: string | null
          certificate_number?: string | null
          cliente_id?: string
          created_at?: string
          data_emissao?: string
          data_pagamento?: string | null
          data_vencimento?: string
          estado?: string
          id?: string
          is_locked?: boolean | null
          metodo_pagamento?: string | null
          numero?: string
          observacoes?: string | null
          qr_code?: string | null
          referencia_pagamento?: string | null
          serie?: string
          signature_hash?: string | null
          subtotal?: number
          tipo?: string
          total?: number
          total_iva?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faturas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          created_at: string
          email: string | null
          endereco: string
          id: string
          nif: string
          nome: string
          telefone: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          endereco: string
          id?: string
          nif: string
          nome: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          endereco?: string
          id?: string
          nif?: string
          nome?: string
          telefone?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_sends: {
        Row: {
          channel: Database["public"]["Enums"]["send_channel"]
          created_at: string
          delivered_at: string | null
          external_message_id: string | null
          failed_at: string | null
          failure_reason: string | null
          fallback_used: boolean
          fatura_id: string
          id: string
          max_retries: number
          pdf_url: string | null
          read_at: string | null
          recipient: string
          retry_count: number
          sent_at: string | null
          status: Database["public"]["Enums"]["send_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["send_channel"]
          created_at?: string
          delivered_at?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          fallback_used?: boolean
          fatura_id: string
          id?: string
          max_retries?: number
          pdf_url?: string | null
          read_at?: string | null
          recipient: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["send_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["send_channel"]
          created_at?: string
          delivered_at?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          fallback_used?: boolean
          fatura_id?: string
          id?: string
          max_retries?: number
          pdf_url?: string | null
          read_at?: string | null
          recipient?: string
          retry_count?: number
          sent_at?: string | null
          status?: Database["public"]["Enums"]["send_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sends_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_fatura: {
        Row: {
          created_at: string
          desconto: number
          fatura_id: string
          id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          taxa_iva: number
          total: number
          valor_iva: number
        }
        Insert: {
          created_at?: string
          desconto?: number
          fatura_id: string
          id?: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
          taxa_iva?: number
          total: number
          valor_iva: number
        }
        Update: {
          created_at?: string
          desconto?: number
          fatura_id?: string
          id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
          taxa_iva?: number
          total?: number
          valor_iva?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_fatura_fatura_id_fkey"
            columns: ["fatura_id"]
            isOneToOne: false
            referencedRelation: "faturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_fatura_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          iva_incluido: boolean
          nome: string
          preco_unitario: number
          stock: number | null
          stock_minimo: number | null
          taxa_iva: number
          tipo: string
          unidade: string
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          iva_incluido?: boolean
          nome: string
          preco_unitario: number
          stock?: number | null
          stock_minimo?: number | null
          taxa_iva?: number
          tipo: string
          unidade: string
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          iva_incluido?: boolean
          nome?: string
          preco_unitario?: number
          stock?: number | null
          stock_minimo?: number | null
          taxa_iva?: number
          tipo?: string
          unidade?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
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
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_audit_log: {
        Args: {
          _action: string
          _entity_id: string
          _entity_type: string
          _new_data?: Json
          _old_data?: Json
          _user_id: string
        }
        Returns: string
      }
      generate_invoice_number: {
        Args: { _serie: string; _user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operador" | "contador"
      send_channel: "whatsapp" | "sms" | "email"
      send_status: "pending" | "sent" | "delivered" | "failed" | "read"
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
      app_role: ["admin", "operador", "contador"],
      send_channel: ["whatsapp", "sms", "email"],
      send_status: ["pending", "sent", "delivered", "failed", "read"],
    },
  },
} as const
