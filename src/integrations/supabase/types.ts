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
      setores: {
        Row: {
          criado_em: string
          id: string
          nome: string
          sigla: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          sigla: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          sigla?: string
        }
        Relationships: []
      }
      cargos: {
        Row: {
          criado_em: string
          id: string
          nome: string
          setor_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          setor_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargos_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          cargo_id: string
          criado_em: string
          id: string
          nome: string
          setor_id: string
          user_id: string
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          id?: string
          nome: string
          setor_id: string
          user_id: string
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          id?: string
          nome?: string
          setor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins_sentimento: {
        Row: {
          atualizado_em: string
          colaborador_id: string
          criado_em: string
          data: string
          emocao: string
          id: string
          motivo: string
        }
        Insert: {
          atualizado_em?: string
          colaborador_id: string
          criado_em?: string
          data?: string
          emocao: string
          id?: string
          motivo?: string
        }
        Update: {
          atualizado_em?: string
          colaborador_id?: string
          criado_em?: string
          data?: string
          emocao?: string
          id?: string
          motivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_sentimento_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_desenvolvimento: {
        Row: {
          atualizado_em: string
          colaborador_id: string
          criado_em: string
          criado_por: string
          descricao: string
          id: string
          prazo: string | null
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          colaborador_id: string
          criado_em?: string
          criado_por?: string
          descricao?: string
          id?: string
          prazo?: string | null
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          colaborador_id?: string
          criado_em?: string
          criado_por?: string
          descricao?: string
          id?: string
          prazo?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_desenvolvimento_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_objetivos: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string
          id: string
          plano_id: string
          prazo: string | null
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string
          id?: string
          plano_id: string
          prazo?: string | null
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string
          id?: string
          plano_id?: string
          prazo?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_objetivos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos_desenvolvimento"
            referencedColumns: ["id"]
          },
        ]
      }
      pesquisas_satisfacao: {
        Row: {
          anonima: boolean
          criado_em: string
          criado_por: string
          descricao: string
          id: string
          prazo: string
          tipo: string
          titulo: string
        }
        Insert: {
          anonima?: boolean
          criado_em?: string
          criado_por?: string
          descricao: string
          id?: string
          prazo: string
          tipo?: string
          titulo: string
        }
        Update: {
          anonima?: boolean
          criado_em?: string
          criado_por?: string
          descricao?: string
          id?: string
          prazo?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      reunioes_1a1: {
        Row: {
          categoria: string | null
          colaborador_id: string
          criado_em: string
          data_reuniao: string
          frequencia: string
          hora_fim: string
          hora_inicio: string
          id: string
          organizador_id: string
          recorrencia_ate: string | null
          status: string
        }
        Insert: {
          categoria?: string | null
          colaborador_id: string
          criado_em?: string
          data_reuniao: string
          frequencia?: string
          hora_fim: string
          hora_inicio: string
          id?: string
          organizador_id: string
          recorrencia_ate?: string | null
          status?: string
        }
        Update: {
          categoria?: string | null
          colaborador_id?: string
          criado_em?: string
          data_reuniao?: string
          frequencia?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          organizador_id?: string
          recorrencia_ate?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_1a1_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_1a1_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes_1a1_topicos: {
        Row: {
          criado_em: string
          id: string
          reuniao_id: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          id?: string
          reuniao_id: string
          titulo: string
        }
        Update: {
          criado_em?: string
          id?: string
          reuniao_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_1a1_topicos_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes_1a1"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      perfil_colaborador: {
        Row: {
          cargo: string
          cargo_id: string
          id: string
          nome: string
          setor: string
          setor_id: string
          setor_sigla: string
          user_id: string
        }
        Relationships: []
      }
    }
    Functions: {
      get_acessos_diario_comparativo: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      obter_checkin_sentimento_do_dia: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      registrar_checkin_sentimento: {
        Args: { p_colaborador_id: string; p_emocao: string; p_motivo?: string };
        Returns: void;
      };
      registrar_acesso_diario: {
        Args: { p_colaborador_id: string };
        Returns: void;
      };
      listar_equipe_colaborador: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          user_id: string;
          nome: string;
          cargo: string;
          setor: string;
          setor_sigla: string;
        }[];
      };
      colaborador_compartilha_setor: {
        Args: { p_colaborador_id: string };
        Returns: boolean;
      };
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
