// PROTECTED -- generated from supabase/migrations/0001_business_schema.sql.
// HAND-BUILT during this session: no real tenant-gateway/Neon type generator
// available in this environment. Whenever the schema changes, update this
// file by hand until a real `types:generate` exists.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      movement_reasons: {
        Row: {
          id: string;
          label: string;
          scope: "in" | "out" | "adjustment" | "any";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          scope?: "in" | "out" | "adjustment" | "any";
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["movement_reasons"]["Insert"]>;
      };
      stock_destinations: {
        Row: {
          id: string;
          name: string;
          kind: "sector" | "consumer" | "other";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          kind?: "sector" | "consumer" | "other";
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["stock_destinations"]["Insert"]>;
      };
      purchase_rules: {
        Row: {
          id: string;
          approval_min_amount: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Omit<
            Database["public"]["Tables"]["purchase_rules"]["Row"],
            "id" | "created_at" | "updated_at"
          >
        >;
        Update: Partial<Database["public"]["Tables"]["purchase_rules"]["Insert"]>;
      };
      suppliers: {
        Row: {
          id: string;
          owner_id?: string;
          name: string;
          cnpj: string | null;
          email: string | null;
          phone: string | null;
          lead_time_days: number;
          notes: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cnpj?: string | null;
          email?: string | null;
          phone?: string | null;
          lead_time_days?: number;
          notes?: string | null;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
      };
      locations: {
        Row: {
          id: string;
          owner_id?: string;
          name: string;
          code: string | null;
          kind: string;
          address: string | null;
          notes: string | null;
          is_default: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          kind?: string;
          address?: string | null;
          notes?: string | null;
          is_default?: boolean;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          owner_id?: string;
          sku: string;
          name: string;
          description: string | null;
          category: string | null;
          brand: string | null;
          model: string | null;
          unit: string;
          cost_price: number;
          sale_price: number;
          current_stock: number;
          min_stock: number;
          barcode: string | null;
          ncm: string | null;
          cest: string | null;
          origin: string | null;
          weight_kg: number | null;
          dimensions: Json | null;
          technical_spec: string | null;
          internal_notes: string | null;
          supplier_id: string | null;
          track_batches: boolean;
          track_locations: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          description?: string | null;
          category?: string | null;
          brand?: string | null;
          model?: string | null;
          unit?: string;
          cost_price?: number;
          sale_price?: number;
          current_stock?: number;
          min_stock?: number;
          barcode?: string | null;
          ncm?: string | null;
          cest?: string | null;
          origin?: string | null;
          weight_kg?: number | null;
          dimensions?: Json | null;
          technical_spec?: string | null;
          internal_notes?: string | null;
          supplier_id?: string | null;
          track_batches?: boolean;
          track_locations?: boolean;
          active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_batches: {
        Row: {
          id: string;
          owner_id?: string;
          product_id: string;
          location_id: string | null;
          batch_code: string;
          manufacture_date: string | null;
          expiration_date: string | null;
          quantity: number;
          unit_cost: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          location_id?: string | null;
          batch_code: string;
          manufacture_date?: string | null;
          expiration_date?: string | null;
          quantity?: number;
          unit_cost?: number | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_batches"]["Insert"]>;
      };
      stock_movements: {
        Row: {
          id: string;
          owner_id?: string;
          product_id: string;
          product_name: string;
          batch_id: string | null;
          location_id: string | null;
          destination_location_id: string | null;
          destination_id: string | null;
          type: "in" | "out" | "adjustment" | "transfer";
          origin: "manual" | "purchase" | "sale" | "other";
          quantity: number;
          reason_id: string | null;
          reference_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          product_name: string;
          batch_id?: string | null;
          location_id?: string | null;
          destination_location_id?: string | null;
          destination_id?: string | null;
          type: "in" | "out" | "adjustment" | "transfer";
          origin?: "manual" | "purchase" | "sale" | "other";
          quantity: number;
          reason_id?: string | null;
          reference_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
      };
      purchase_orders: {
        Row: {
          id: string;
          owner_id?: string;
          code: string;
          supplier_id: string;
          supplier_name: string;
          status:
            | "draft"
            | "sent"
            | "pending_approval"
            | "rejected"
            | "cancelled"
            | "partially_received"
            | "fully_received";
          total_amount: number;
          notes: string | null;
          expected_date: string | null;
          sent_at: string | null;
          submitted_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejected_by: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          cancelled_at: string | null;
          received_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          supplier_id: string;
          supplier_name: string;
          status?: Database["public"]["Tables"]["purchase_orders"]["Row"]["status"];
          total_amount?: number;
          notes?: string | null;
          expected_date?: string | null;
          sent_at?: string | null;
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_by?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          cancelled_at?: string | null;
          received_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_orders"]["Insert"]>;
      };
      purchase_order_items: {
        Row: {
          id: string;
          owner_id?: string;
          purchase_order_id: string;
          product_id: string;
          product_name: string;
          quantity_ordered: number;
          quantity_received: number;
          unit_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          product_id: string;
          product_name: string;
          quantity_ordered: number;
          quantity_received?: number;
          unit_cost?: number;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_order_items"]["Insert"]>;
      };
      count_sessions: {
        Row: {
          id: string;
          owner_id?: string;
          code: string;
          name: string;
          category: string | null;
          location_id: string | null;
          status: "open" | "closed" | "cancelled";
          notes: string | null;
          opened_at: string;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category?: string | null;
          location_id?: string | null;
          status?: "open" | "closed" | "cancelled";
          notes?: string | null;
          closed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["count_sessions"]["Insert"]>;
      };
      count_items: {
        Row: {
          id: string;
          owner_id?: string;
          count_session_id: string;
          product_id: string;
          batch_id: string | null;
          expected_quantity: number;
          counted_quantity: number | null;
          counted_by: string | null;
          counted_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          count_session_id: string;
          product_id: string;
          batch_id?: string | null;
          expected_quantity?: number;
          counted_quantity?: number | null;
          counted_by?: string | null;
          counted_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["count_items"]["Insert"]>;
      };
    };
  };
}
