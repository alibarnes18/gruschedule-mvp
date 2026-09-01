// Hand-written to match supabase/migrations/*.sql until the project is
// linked to a live Supabase instance, at which point this should be
// regenerated with `supabase gen types typescript`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      faculties: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          faculty_id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          faculty_id: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          faculty_id?: string;
          name?: string;
          slug?: string;
        };
      };
      sections: {
        Row: {
          id: string;
          department_id: string;
          grade_level: number;
          section_label: string | null;
        };
        Insert: {
          id?: string;
          department_id: string;
          grade_level: number;
          section_label?: string | null;
        };
        Update: {
          id?: string;
          department_id?: string;
          grade_level?: number;
          section_label?: string | null;
        };
      };
      source_documents: {
        Row: {
          id: string;
          source_url: string;
          document_type:
            | "exam_schedule"
            | "academic_calendar"
            | "menu"
            | "class_schedule";
          content_hash: string;
          fetched_at: string;
          parse_status: "pending" | "success" | "failed" | "needs_review";
        };
        Insert: {
          id?: string;
          source_url: string;
          document_type:
            | "exam_schedule"
            | "academic_calendar"
            | "menu"
            | "class_schedule";
          content_hash: string;
          fetched_at?: string;
          parse_status?: "pending" | "success" | "failed" | "needs_review";
        };
        Update: {
          id?: string;
          source_url?: string;
          document_type?:
            | "exam_schedule"
            | "academic_calendar"
            | "menu"
            | "class_schedule";
          content_hash?: string;
          fetched_at?: string;
          parse_status?: "pending" | "success" | "failed" | "needs_review";
        };
      };
      class_schedule_entries: {
        Row: {
          id: string;
          section_id: string;
          course_name: string;
          instructor: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          location: string | null;
          source_document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          course_name: string;
          instructor?: string | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          location?: string | null;
          source_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          course_name?: string;
          instructor?: string | null;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          source_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      exam_events: {
        Row: {
          id: string;
          department_id: string;
          exam_type: "midterm" | "final" | "makeup";
          course_name: string;
          exam_date: string;
          exam_time: string | null;
          location: string | null;
          source_document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          department_id: string;
          exam_type: "midterm" | "final" | "makeup";
          course_name: string;
          exam_date: string;
          exam_time?: string | null;
          location?: string | null;
          source_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          department_id?: string;
          exam_type?: "midterm" | "final" | "makeup";
          course_name?: string;
          exam_date?: string;
          exam_time?: string | null;
          location?: string | null;
          source_document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      academic_calendar_events: {
        Row: {
          id: string;
          title: string;
          start_date: string;
          end_date: string | null;
          description: string | null;
          source_document_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          start_date: string;
          end_date?: string | null;
          description?: string | null;
          source_document_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          start_date?: string;
          end_date?: string | null;
          description?: string | null;
          source_document_id?: string | null;
          created_at?: string;
        };
      };
      menu_days: {
        Row: {
          id: string;
          date: string;
          items: string[];
          source_document_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          items: string[];
          source_document_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          items?: string[];
          source_document_id?: string | null;
          created_at?: string;
        };
      };
      notification_subscriptions: {
        Row: {
          id: string;
          telegram_chat_id: string;
          department_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          telegram_chat_id: string;
          department_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          telegram_chat_id?: string;
          department_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
