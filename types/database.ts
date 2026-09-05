/**
 * GENERADO desde el esquema real de Supabase. No editar a mano.
 *
 * Regenerar con el MCP de Supabase (`generate_typescript_types`) o con:
 *   npx supabase gen types typescript --project-id uhqgwhbuezfvaltgumap > types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      expense_lists: {
        Row: {
          archived_at: string | null
          created_at: string
          house_id: string
          id: string
          name: string
          position: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          house_id: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          house_id?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_lists_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          charge_date: string | null
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          house_id: string
          id: string
          list_id: string
          name: string
          period_id: string
          recurring_template_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          charge_date?: string | null
          created_at?: string
          created_by?: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          house_id: string
          id?: string
          list_id: string
          name: string
          period_id: string
          recurring_template_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          charge_date?: string | null
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          house_id?: string
          id?: string
          list_id?: string
          name?: string
          period_id?: string
          recurring_template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "expense_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "expenses_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurring_template_fk"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "recurring_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          join_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          join_code: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          join_code?: string
          name?: string
        }
        Relationships: []
      }
      item_photos: {
        Row: {
          created_at: string
          id: string
          item_id: string
          kind: Database["public"]["Enums"]["photo_kind"]
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          kind?: Database["public"]["Enums"]["photo_kind"]
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          kind?: Database["public"]["Enums"]["photo_kind"]
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_photos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shopping_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_tags: {
        Row: {
          item_id: string
          tag_id: string
        }
        Insert: {
          item_id: string
          tag_id: string
        }
        Update: {
          item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shopping_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          expense_id: string | null
          house_id: string
          id: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          list_id: string | null
          membership_id: string
          percent_applied: number | null
          period_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          description: string
          expense_id?: string | null
          house_id: string
          id?: string
          kind: Database["public"]["Enums"]["ledger_kind"]
          list_id?: string | null
          membership_id: string
          percent_applied?: number | null
          period_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          description?: string
          expense_id?: string | null
          house_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["ledger_kind"]
          list_id?: string | null
          membership_id?: string
          percent_applied?: number | null
          period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "expense_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "ledger_entries_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "ledger_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "ledger_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      list_shares: {
        Row: {
          id: string
          list_id: string
          membership_id: string
          percent: number
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          membership_id: string
          percent: number
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          membership_id?: string
          percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_shares_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "expense_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_shares_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "list_shares_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_shares_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["membership_id"]
          },
        ]
      }
      memberships: {
        Row: {
          house_id: string
          id: string
          joined_at: string
          left_at: string | null
          role: Database["public"]["Enums"]["house_role"]
          user_id: string
        }
        Insert: {
          house_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["house_role"]
          user_id: string
        }
        Update: {
          house_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["house_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          membership_id: string
          payment_id: string
          period_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          membership_id: string
          payment_id: string
          period_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          membership_id?: string
          payment_id?: string
          period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "payment_allocations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "payment_allocations_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          currency: Database["public"]["Enums"]["currency_code"]
          house_id: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          membership_id: string
          method: string | null
          note: string | null
          recorded_at: string
          recorded_by: string
          reverses_payment_id: string | null
        }
        Insert: {
          amount: number
          currency: Database["public"]["Enums"]["currency_code"]
          house_id: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          membership_id: string
          method?: string | null
          note?: string | null
          recorded_at?: string
          recorded_by: string
          reverses_payment_id?: string | null
        }
        Update: {
          amount?: number
          currency?: Database["public"]["Enums"]["currency_code"]
          house_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          membership_id?: string
          method?: string | null
          note?: string | null
          recorded_at?: string
          recorded_by?: string
          reverses_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "payments_reverses_payment_id_fkey"
            columns: ["reverses_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      period_carryovers: {
        Row: {
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_code"]
          id: string
          membership_id: string
          period_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          membership_id: string
          period_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          membership_id?: string
          period_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "period_carryovers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "membership_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "period_carryovers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "period_carryovers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["membership_id"]
          },
          {
            foreignKeyName: "period_carryovers_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "period_balances"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "period_carryovers_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
        ]
      }
      periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          house_id: string
          id: string
          month: string
          status: Database["public"]["Enums"]["period_status"]
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          house_id: string
          id?: string
          month: string
          status?: Database["public"]["Enums"]["period_status"]
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          house_id?: string
          id?: string
          month?: string
          status?: Database["public"]["Enums"]["period_status"]
        }
        Relationships: [
          {
            foreignKeyName: "periods_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      price_observations: {
        Row: {
          amount: number
          currency: Database["public"]["Enums"]["currency_code"]
          house_id: string
          id: string
          observed_at: string
          observed_by: string | null
          product_id: string
          store_id: string | null
          unit_note: string | null
        }
        Insert: {
          amount: number
          currency: Database["public"]["Enums"]["currency_code"]
          house_id: string
          id?: string
          observed_at?: string
          observed_by?: string | null
          product_id: string
          store_id?: string | null
          unit_note?: string | null
        }
        Update: {
          amount?: number
          currency?: Database["public"]["Enums"]["currency_code"]
          house_id?: string
          id?: string
          observed_at?: string
          observed_by?: string | null
          product_id?: string
          store_id?: string | null
          unit_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_observations_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      price_suggestions: {
        Row: {
          amount: number
          confidence: Database["public"]["Enums"]["confidence_level"]
          currency: Database["public"]["Enums"]["currency_code"]
          fetched_at: string
          house_id: string
          id: string
          product_id: string
          rationale: string | null
          source_url: string | null
          store_id: string | null
          unit_note: string | null
        }
        Insert: {
          amount: number
          confidence: Database["public"]["Enums"]["confidence_level"]
          currency: Database["public"]["Enums"]["currency_code"]
          fetched_at?: string
          house_id: string
          id?: string
          product_id: string
          rationale?: string | null
          source_url?: string | null
          store_id?: string | null
          unit_note?: string | null
        }
        Update: {
          amount?: number
          confidence?: Database["public"]["Enums"]["confidence_level"]
          currency?: Database["public"]["Enums"]["currency_code"]
          fetched_at?: string
          house_id?: string
          id?: string
          product_id?: string
          rationale?: string | null
          source_url?: string | null
          store_id?: string | null
          unit_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_suggestions_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_suggestions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          created_by: string | null
          house_id: string
          id: string
          name: string
          normalized_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          house_id: string
          id?: string
          name: string
          normalized_name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          house_id?: string
          id?: string
          name?: string
          normalized_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      recurring_templates: {
        Row: {
          amount: number
          charge_day: number | null
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          first_charge_month: string
          house_id: string
          id: string
          last_charge_month: string | null
          list_id: string
          name: string
        }
        Insert: {
          amount: number
          charge_day?: number | null
          created_at?: string
          created_by?: string | null
          currency: Database["public"]["Enums"]["currency_code"]
          first_charge_month: string
          house_id: string
          id?: string
          last_charge_month?: string | null
          list_id: string
          name: string
        }
        Update: {
          amount?: number
          charge_day?: number | null
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_code"]
          first_charge_month?: string
          house_id?: string
          id?: string
          last_charge_month?: string | null
          list_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_templates_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_templates_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "expense_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          added_by: string | null
          archived_at: string | null
          created_at: string
          house_id: string
          id: string
          note: string | null
          product_id: string
          purchased_at: string | null
          purchased_by: string | null
          quantity: string | null
          status: Database["public"]["Enums"]["item_status"]
          store_id: string
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          archived_at?: string | null
          created_at?: string
          house_id: string
          id?: string
          note?: string | null
          product_id: string
          purchased_at?: string | null
          purchased_by?: string | null
          quantity?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          store_id: string
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          archived_at?: string | null
          created_at?: string
          house_id?: string
          id?: string
          note?: string | null
          product_id?: string
          purchased_at?: string | null
          purchased_by?: string | null
          quantity?: string | null
          status?: Database["public"]["Enums"]["item_status"]
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          created_by: string | null
          house_id: string
          id: string
          is_default: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          house_id: string
          id?: string
          is_default?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          house_id?: string
          id?: string
          is_default?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          house_id: string
          id: string
          name: string
        }
        Insert: {
          house_id: string
          id?: string
          name: string
        }
        Update: {
          house_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      membership_balances: {
        Row: {
          balance: number | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          house_id: string | null
          membership_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      period_balances: {
        Row: {
          balance: number | null
          currency: Database["public"]["Enums"]["currency_code"] | null
          house_id: string | null
          membership_id: string | null
          month: string | null
          period_id: string | null
          status: Database["public"]["Enums"]["period_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "periods_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      allocate_payment: { Args: { p_payment_id: string }; Returns: undefined }
      cr_month: { Args: { p_at?: string }; Returns: string }
      current_actor: { Args: never; Returns: string }
      generate_join_code: { Args: never; Returns: string }
      house_residue_admin: { Args: { p_house_id: string }; Returns: string }
      membership_balance: {
        Args: {
          p_currency: Database["public"]["Enums"]["currency_code"]
          p_membership_id: string
        }
        Returns: number
      }
      split_expense_amount: {
        Args: {
          p_amount: number
          p_list_id: string
          p_residue_membership_id: string
        }
        Returns: {
          membership_id: string
          percent: number
          share: number
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      confidence_level: "alta" | "media" | "baja"
      currency_code: "CRC" | "USD"
      house_role: "admin" | "member"
      item_status: "pending" | "purchased" | "archived"
      ledger_kind: "charge" | "expense_adjustment" | "percent_adjustment"
      payment_kind: "payment" | "reversal" | "refund"
      period_status: "open" | "closed"
      photo_kind: "producto" | "etiqueta"
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
    Enums: {
      confidence_level: ["alta", "media", "baja"],
      currency_code: ["CRC", "USD"],
      house_role: ["admin", "member"],
      item_status: ["pending", "purchased", "archived"],
      ledger_kind: ["charge", "expense_adjustment", "percent_adjustment"],
      payment_kind: ["payment", "reversal", "refund"],
      period_status: ["open", "closed"],
      photo_kind: ["producto", "etiqueta"],
    },
  },
} as const
