export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      collections: {
        Row: {
          created_at: string;
          creation_request_id: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string;
          preset_key: string | null;
          updated_at: string;
          view_config: Json;
        };
        Insert: {
          created_at?: string;
          creation_request_id?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id: string;
          preset_key?: string | null;
          updated_at?: string;
          view_config?: Json;
        };
        Update: {
          created_at?: string;
          creation_request_id?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string;
          preset_key?: string | null;
          updated_at?: string;
          view_config?: Json;
        };
        Relationships: [];
      };
      field_definitions: {
        Row: {
          collection_id: string;
          created_at: string;
          id: string;
          name: string;
          position: number;
          required: boolean;
          type: Database["public"]["Enums"]["field_type"];
        };
        Insert: {
          collection_id: string;
          created_at?: string;
          id?: string;
          name: string;
          position: number;
          required?: boolean;
          type: Database["public"]["Enums"]["field_type"];
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          position?: number;
          required?: boolean;
          type?: Database["public"]["Enums"]["field_type"];
        };
        Relationships: [
          {
            foreignKeyName: "field_definitions_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      field_options: {
        Row: {
          field_id: string;
          id: string;
          label: string;
          position: number;
        };
        Insert: {
          field_id: string;
          id?: string;
          label: string;
          position: number;
        };
        Update: {
          field_id?: string;
          id?: string;
          label?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "field_options_field_id_fkey";
            columns: ["field_id"];
            isOneToOne: false;
            referencedRelation: "field_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      items: {
        Row: {
          collection_id: string;
          created_at: string;
          description: string | null;
          id: string;
          image_path: string | null;
          title: string;
          updated_at: string;
          values: Json;
        };
        Insert: {
          collection_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          title: string;
          updated_at?: string;
          values?: Json;
        };
        Update: {
          collection_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          title?: string;
          updated_at?: string;
          values?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "items_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      storage_cleanup_jobs: {
        Row: {
          attempt_count: number;
          collection_id: string | null;
          created_at: string;
          id: string;
          item_id: string | null;
          last_error_code: string | null;
          object_path: string;
          operation: Database["public"]["Enums"]["cleanup_job_operation"];
          owner_id: string;
          status: Database["public"]["Enums"]["cleanup_job_status"];
          updated_at: string;
        };
        Insert: {
          attempt_count?: number;
          collection_id?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string | null;
          last_error_code?: string | null;
          object_path: string;
          operation?: Database["public"]["Enums"]["cleanup_job_operation"];
          owner_id: string;
          status?: Database["public"]["Enums"]["cleanup_job_status"];
          updated_at?: string;
        };
        Update: {
          attempt_count?: number;
          collection_id?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string | null;
          last_error_code?: string | null;
          object_path?: string;
          operation?: Database["public"]["Enums"]["cleanup_job_operation"];
          owner_id?: string;
          status?: Database["public"]["Enums"]["cleanup_job_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "storage_cleanup_jobs_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "storage_cleanup_jobs_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_storage_cleanup_jobs: {
        Args: { p_limit: number; p_stale_before: string };
        Returns: {
          attempt_count: number;
          id: string;
          object_path: string;
        }[];
      };
      complete_item_image_cleanup: {
        Args: { p_job_id: string };
        Returns: boolean;
      };
      create_collection_with_schema: {
        Args: {
          p_description: string | null;
          p_fields: Json;
          p_name: string;
          p_preset_key: string;
          p_request_id: string;
          p_view_config: Json;
        };
        Returns: string;
      };
      create_item_with_values: {
        Args: {
          p_collection_id: string;
          p_description: string | null;
          p_title: string;
          p_values: Json;
        };
        Returns: string;
      };
      delete_collection_with_cleanup: {
        Args: {
          p_collection_id: string;
          p_confirmation_name: string;
        };
        Returns: {
          id: string;
          scheduled_image_count: number;
        };
      };
      delete_item_with_cleanup: {
        Args: { p_collection_id: string; p_item_id: string };
        Returns: {
          cleanup_job_id: string | null;
          id: string;
          image_path: string | null;
        };
      };
      queue_item_image_cleanup: {
        Args: {
          p_collection_id: string;
          p_error_code: string;
          p_item_id: string;
          p_object_path: string;
        };
        Returns: string;
      };
      set_item_image_path: {
        Args: {
          p_collection_id: string;
          p_image_path: string | null;
          p_item_id: string;
        };
        Returns: { cleanup_job_id: string | null; old_path: string | null };
      };
      enforce_collection_field_limit: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      enforce_select_option_limit: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      update_item_with_values: {
        Args: {
          p_collection_id: string;
          p_description: string | null;
          p_item_id: string;
          p_title: string;
          p_values: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      cleanup_job_operation: "delete";
      cleanup_job_status: "pending" | "processing" | "failed" | "complete";
      field_type: "text" | "number" | "date" | "rating" | "select" | "url";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends (PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;
