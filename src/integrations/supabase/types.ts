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
      acessos_diarios: {
        Row: {
          colaborador_id: string
          criado_em: string
          data: string
          id: string
        }
        Insert: {
          colaborador_id: string
          criado_em?: string
          data?: string
          id?: string
        }
        Update: {
          colaborador_id?: string
          criado_em?: string
          data?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acessos_diarios_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acessos_diarios_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "perfil_colaborador"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_psicossociais: {
        Row: {
          criado_em: string
          criado_por: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          setor_id: string | null
          status: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          setor_id?: string | null
          status?: string
          titulo: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          setor_id?: string | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_psicossociais_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "checkins_sentimento_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "perfil_colaborador"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          cargo_id: string
          criado_em: string
          foto_url: string | null
          id: string
          nome: string
          setor_id: string
          user_id: string
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          foto_url?: string | null
          id?: string
          nome: string
          setor_id: string
          user_id: string
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          foto_url?: string | null
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
      colaboradores_importados: {
        Row: {
          atualizado_em: string
          biografia: string
          cargo: string
          cargo_visivel: string
          cpf: string
          criado_em: string
          data_admissao: string
          data_cadastro: string
          data_nascimento: string
          departamento: string
          desligamento: string
          email: string
          etnia: string
          foto_url: string | null
          genero: string
          gestor_direto: string
          gestor_direto_email: string
          grupos: string
          id: string
          id_planilha: string
          idioma: string
          matricula: string
          nome: string
          nome_completo: string
          origem_cadastro: string
          papel: string
          participa_gamificacao: string
          sexo: string
          situacao: string
          ultimo_acesso: string
          ultimo_dia_trabalhado: string
          unidade: string
        }
        Insert: {
          atualizado_em?: string
          biografia?: string
          cargo?: string
          cargo_visivel?: string
          cpf?: string
          criado_em?: string
          data_admissao?: string
          data_cadastro?: string
          data_nascimento?: string
          departamento?: string
          desligamento?: string
          email: string
          etnia?: string
          foto_url?: string | null
          genero?: string
          gestor_direto?: string
          gestor_direto_email?: string
          grupos?: string
          id?: string
          id_planilha: string
          idioma?: string
          matricula?: string
          nome: string
          nome_completo: string
          origem_cadastro?: string
          papel?: string
          participa_gamificacao?: string
          sexo?: string
          situacao?: string
          ultimo_acesso?: string
          ultimo_dia_trabalhado?: string
          unidade?: string
        }
        Update: {
          atualizado_em?: string
          biografia?: string
          cargo?: string
          cargo_visivel?: string
          cpf?: string
          criado_em?: string
          data_admissao?: string
          data_cadastro?: string
          data_nascimento?: string
          departamento?: string
          desligamento?: string
          email?: string
          etnia?: string
          foto_url?: string | null
          genero?: string
          gestor_direto?: string
          gestor_direto_email?: string
          grupos?: string
          id?: string
          id_planilha?: string
          idioma?: string
          matricula?: string
          nome?: string
          nome_completo?: string
          origem_cadastro?: string
          papel?: string
          participa_gamificacao?: string
          sexo?: string
          situacao?: string
          ultimo_acesso?: string
          ultimo_dia_trabalhado?: string
          unidade?: string
        }
        Relationships: []
      }
      fatores_psicossociais: {
        Row: {
          criado_em: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          criado_em?: string
          id?: string
          nome: string
          ordem: number
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
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
      perguntas_psicossociais: {
        Row: {
          avaliacao_id: string
          criado_em: string
          fator_id: string
          id: string
          obrigatoria: boolean
          opcoes: Json | null
          ordem: number
          texto: string
          tipo_resposta: string
        }
        Insert: {
          avaliacao_id: string
          criado_em?: string
          fator_id: string
          id?: string
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem?: number
          texto: string
          tipo_resposta?: string
        }
        Update: {
          avaliacao_id?: string
          criado_em?: string
          fator_id?: string
          id?: string
          obrigatoria?: boolean
          opcoes?: Json | null
          ordem?: number
          texto?: string
          tipo_resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "perguntas_psicossociais_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_psicossociais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perguntas_psicossociais_fator_id_fkey"
            columns: ["fator_id"]
            isOneToOne: false
            referencedRelation: "fatores_psicossociais"
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
          {
            foreignKeyName: "planos_desenvolvimento_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "perfil_colaborador"
            referencedColumns: ["id"]
          },
        ]
      }
      respostas_psicossociais: {
        Row: {
          colaborador_id: string
          id: string
          pergunta_id: string
          respondido_em: string
          resposta: Json
        }
        Insert: {
          colaborador_id: string
          id?: string
          pergunta_id: string
          respondido_em?: string
          resposta: Json
        }
        Update: {
          colaborador_id?: string
          id?: string
          pergunta_id?: string
          respondido_em?: string
          resposta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "respostas_psicossociais_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_psicossociais_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "perfil_colaborador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_psicossociais_pergunta_id_fkey"
            columns: ["pergunta_id"]
            isOneToOne: false
            referencedRelation: "perguntas_psicossociais"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados_psicossociais: {
        Row: {
          avaliacao_id: string
          calculado_em: string
          distribuicao: Json
          fator_id: string
          id: string
          media: number | null
          setor_id: string | null
          total_respostas: number
        }
        Insert: {
          avaliacao_id: string
          calculado_em?: string
          distribuicao?: Json
          fator_id: string
          id?: string
          media?: number | null
          setor_id?: string | null
          total_respostas?: number
        }
        Update: {
          avaliacao_id?: string
          calculado_em?: string
          distribuicao?: Json
          fator_id?: string
          id?: string
          media?: number | null
          setor_id?: string | null
          total_respostas?: number
        }
        Relationships: [
          {
            foreignKeyName: "resultados_psicossociais_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "avaliacoes_psicossociais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_psicossociais_fator_id_fkey"
            columns: ["fator_id"]
            isOneToOne: false
            referencedRelation: "fatores_psicossociais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resultados_psicossociais_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "reunioes_1a1_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "perfil_colaborador"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_1a1_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_1a1_organizador_id_fkey"
            columns: ["organizador_id"]
            isOneToOne: false
            referencedRelation: "perfil_colaborador"
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
      vagas: {
        Row: {
          cargo_id: string
          criado_em: string
          criado_por: string | null
          id: string
          setor_id: string
          status: string
          titulo: string
        }
        Insert: {
          cargo_id: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          setor_id: string
          status?: string
          titulo: string
        }
        Update: {
          cargo_id?: string
          criado_em?: string
          criado_por?: string | null
          id?: string
          setor_id?: string
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vagas_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      perfil_colaborador: {
        Row: {
          cargo: string | null
          cargo_id: string | null
          id: string | null
          nome: string | null
          setor: string | null
          setor_id: string | null
          setor_sigla: string | null
          user_id: string | null
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
    }
    Functions: {
      colaborador_compartilha_setor: {
        Args: { p_colaborador_id: string }
        Returns: boolean
      }
      get_acessos_diario_comparativo: {
        Args: { p_user_id: string }
        Returns: Json
      }
      listar_equipe_colaborador: {
        Args: never
        Returns: {
          cargo: string
          foto_url: string
          id: string
          nome: string
          setor: string
          setor_sigla: string
          user_id: string
        }[]
      }
      obter_checkin_sentimento_do_dia: { Args: never; Returns: Json }
      registrar_acesso_diario: {
        Args: { p_colaborador_id: string }
        Returns: undefined
      }
      registrar_checkin_sentimento: {
        Args: { p_colaborador_id: string; p_emocao: string; p_motivo?: string }
        Returns: undefined
      }
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
