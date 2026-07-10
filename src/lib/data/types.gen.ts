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
          min_quotes_required: number;
          approval_min_amount: number | null;
          requires_delivery_check: boolean;
          delivery_check_min_amount: number | null;
          requires_justification_below_min_quotes: boolean;
          requires_request_for_order: boolean;
          requires_winner_approval: boolean;
          approver_roles: string[];
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
          photo_url: string | null;
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
          photo_url?: string | null;
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
      purchase_requests: {
        Row: {
          id: string;
          owner_id?: string;
          code: string;
          title: string;
          justification: string | null;
          priority: "low" | "normal" | "high" | "urgent";
          status:
            | "draft"
            | "pending_approval"
            | "approved"
            | "rejected"
            | "converted"
            | "cancelled";
          expected_date: string | null;
          approved_by: string | null;
          approved_at: string | null;
          rejected_by: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          converted_to_order_id: string | null;
          converted_to_quote_id: string | null;
          submitted_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          justification?: string | null;
          priority?: "low" | "normal" | "high" | "urgent";
          status?:
            | "draft"
            | "pending_approval"
            | "approved"
            | "rejected"
            | "converted"
            | "cancelled";
          expected_date?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          rejected_by?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          converted_to_order_id?: string | null;
          converted_to_quote_id?: string | null;
          submitted_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_requests"]["Insert"]>;
      };
      purchase_request_items: {
        Row: {
          id: string;
          owner_id?: string;
          purchase_request_id: string;
          product_id: string;
          quantity: number;
          estimated_unit_cost: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_request_id: string;
          product_id: string;
          quantity: number;
          estimated_unit_cost?: number | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_request_items"]["Insert"]>;
      };
      quotes: {
        Row: {
          id: string;
          owner_id?: string;
          code: string;
          title: string;
          purchase_request_id: string | null;
          status:
            | "draft"
            | "sent"
            | "receiving"
            | "closed"
            | "cancelled"
            | "winner_pending_approval";
          deadline: string | null;
          sent_at: string | null;
          closed_at: string | null;
          winning_response_id: string | null;
          converted_to_order_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          purchase_request_id?: string | null;
          status?:
            | "draft"
            | "sent"
            | "receiving"
            | "closed"
            | "cancelled"
            | "winner_pending_approval";
          deadline?: string | null;
          sent_at?: string | null;
          closed_at?: string | null;
          winning_response_id?: string | null;
          converted_to_order_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quotes"]["Insert"]>;
      };
      quote_items: {
        Row: {
          id: string;
          owner_id?: string;
          quote_id: string;
          product_id: string;
          quantity: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          product_id: string;
          quantity: number;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quote_items"]["Insert"]>;
      };
      quote_suppliers: {
        Row: {
          id: string;
          owner_id?: string;
          quote_id: string;
          supplier_id: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: { id?: string; quote_id: string; supplier_id: string; sent_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["quote_suppliers"]["Insert"]>;
      };
      quote_responses: {
        Row: {
          id: string;
          owner_id?: string;
          quote_id: string;
          supplier_id: string;
          supplier_name: string;
          items: Json;
          total_amount: number;
          delivery_days: number | null;
          payment_terms: string | null;
          notes: string | null;
          received_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          supplier_id: string;
          supplier_name: string;
          items: Json;
          total_amount: number;
          delivery_days?: number | null;
          payment_terms?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quote_responses"]["Insert"]>;
      };
      purchase_orders: {
        Row: {
          id: string;
          owner_id?: string;
          code: string;
          supplier_id: string;
          supplier_name: string;
          purchase_request_id: string | null;
          status:
            | "draft"
            | "sent"
            | "pending_approval"
            | "approved"
            | "rejected"
            | "cancelled"
            | "delivered_pending_check"
            | "partially_received"
            | "fully_received";
          total_amount: number;
          quotes_count: number;
          justification: string | null;
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
          delivered_at: string | null;
          check_completed_by: string | null;
          check_completed_at: string | null;
          received_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          supplier_id: string;
          supplier_name: string;
          purchase_request_id?: string | null;
          status?: Database["public"]["Tables"]["purchase_orders"]["Row"]["status"];
          total_amount?: number;
          quotes_count?: number;
          justification?: string | null;
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
          delivered_at?: string | null;
          check_completed_by?: string | null;
          check_completed_at?: string | null;
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
      purchase_approvals: {
        Row: {
          id: string;
          owner_id?: string;
          purchase_order_id: string;
          approver_id: string | null;
          decision: "pending" | "approved" | "rejected";
          comment: string | null;
          justification: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          approver_id?: string | null;
          decision?: "pending" | "approved" | "rejected";
          comment?: string | null;
          justification?: string | null;
          decided_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_approvals"]["Insert"]>;
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
