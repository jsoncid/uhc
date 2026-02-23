// ── Module 2 Supabase schema types ────────────────────────────────────────────
// Mirrors the actual module2.* DDL in Supabase.
// Imported by src/lib/supabase.ts and used as Database['module2'].

export type Module2Database = {
  Tables: {
    referral: {
      Row: {
        id: string;
        created_at: string;
        status: boolean | null;
        patient_profile: string | null;
        from_assignment: string | null;
        to_assignment: string | null;
        deactivated_at: string | null;
        deactivated_by: string | null;
        rejection_reason: string | null;
        accepted_by: string | null;
        redirect_to: string | null;
      };
      Insert: {
        id?: string;
        created_at?: string;
        status?: boolean | null;
        patient_profile?: string | null;
        from_assignment?: string | null;
        to_assignment?: string | null;
        deactivated_at?: string | null;
        deactivated_by?: string | null;
        rejection_reason?: string | null;
        accepted_by?: string | null;
        redirect_to?: string | null;
      };
      Update: {
        id?: string;
        created_at?: string;
        status?: boolean | null;
        patient_profile?: string | null;
        from_assignment?: string | null;
        to_assignment?: string | null;
        deactivated_at?: string | null;
        deactivated_by?: string | null;
        rejection_reason?: string | null;
        accepted_by?: string | null;
        redirect_to?: string | null;
      };
    };
    referral_history: {
      Row: {
        id: string;
        created_at: string;
        details: string | null;
        referral: string | null;
        to_assignment: string | null;
        status: string | null; // uuid FK → module2.status(id)
        is_active: boolean | null;
      };
      Insert: {
        id?: string;
        created_at?: string;
        details?: string | null;
        referral?: string | null;
        to_assignment?: string | null;
        status?: string | null;
        is_active?: boolean | null;
      };
      Update: {
        id?: string;
        created_at?: string;
        details?: string | null;
        referral?: string | null;
        to_assignment?: string | null;
        status?: string | null;
        is_active?: boolean | null;
      };
    };
    referral_info: {
      Row: {
        id: string;
        created_at: string;
        referral: string | null;
        reason_referral: string | null;
        referring_doctor: string | null;
        contact_no: string | null;
        chief_complaints: string | null;
        medications: string | null;
        history_present_illness: string | null;
        pe: string | null;
        blood_pressure: string | null;
        temperature: string | null;
        heart_rate: string | null;
        respiratory_rate: string | null;
        o2_sat: string | null;
        o2_requirement: string | null;
        gcs: string | null;
        eye: string | null;
        vision: string | null;
        motor: string | null;
        rtpcr: string | null;
        rtpcr_date: string | null;
        antigen: string | null;
        antigen_date: string | null;
        exposure_covid: string | null;
        lmp: string | null;
        aog: string | null;
        edc: string | null;
        fh: string | null;
        fht: string | null;
        ie: string | null;
        dilatation: string | null;
        effacement: string | null;
        station: string | null;
        presenting_part: string | null;
        prom_hours: string | null;
        ultrasound_1st_date: string | null;
        ultrasound_1st_aog: string | null;
        ultrasound_latest_date: string | null;
        ultrasound_efw: string | null;
        ultrasound_presentation: string | null;
        ultrasound_impression: string | null;
        gravida: string | null;
        parity: string | null;
        menarche: string | null;
        comorbidity: string | null;
        previous_surgeries: string | null;
        previous_cs: string | null;
        lab_result: string | null;
        xray: string | null;
        other_diagnostics: string | null;
      };
      Insert: {
        id?: string;
        created_at?: string;
        referral?: string | null;
        reason_referral?: string | null;
        referring_doctor?: string | null;
        contact_no?: string | null;
        chief_complaints?: string | null;
        medications?: string | null;
        history_present_illness?: string | null;
        pe?: string | null;
        blood_pressure?: string | null;
        temperature?: string | null;
        heart_rate?: string | null;
        respiratory_rate?: string | null;
        o2_sat?: string | null;
        o2_requirement?: string | null;
        gcs?: string | null;
        eye?: string | null;
        vision?: string | null;
        motor?: string | null;
        rtpcr?: string | null;
        rtpcr_date?: string | null;
        antigen?: string | null;
        antigen_date?: string | null;
        exposure_covid?: string | null;
        lmp?: string | null;
        aog?: string | null;
        edc?: string | null;
        fh?: string | null;
        fht?: string | null;
        ie?: string | null;
        dilatation?: string | null;
        effacement?: string | null;
        station?: string | null;
        presenting_part?: string | null;
        prom_hours?: string | null;
        ultrasound_1st_date?: string | null;
        ultrasound_1st_aog?: string | null;
        ultrasound_latest_date?: string | null;
        ultrasound_efw?: string | null;
        ultrasound_presentation?: string | null;
        ultrasound_impression?: string | null;
        gravida?: string | null;
        parity?: string | null;
        menarche?: string | null;
        comorbidity?: string | null;
        previous_surgeries?: string | null;
        previous_cs?: string | null;
        lab_result?: string | null;
        xray?: string | null;
        other_diagnostics?: string | null;
      };
      Update: {
        id?: string;
        created_at?: string;
        referral?: string | null;
        reason_referral?: string | null;
        referring_doctor?: string | null;
        contact_no?: string | null;
        chief_complaints?: string | null;
        medications?: string | null;
        history_present_illness?: string | null;
        pe?: string | null;
        blood_pressure?: string | null;
        temperature?: string | null;
        heart_rate?: string | null;
        respiratory_rate?: string | null;
        o2_sat?: string | null;
        o2_requirement?: string | null;
        gcs?: string | null;
        eye?: string | null;
        vision?: string | null;
        motor?: string | null;
        rtpcr?: string | null;
        rtpcr_date?: string | null;
        antigen?: string | null;
        antigen_date?: string | null;
        exposure_covid?: string | null;
        lmp?: string | null;
        aog?: string | null;
        edc?: string | null;
        fh?: string | null;
        fht?: string | null;
        ie?: string | null;
        dilatation?: string | null;
        effacement?: string | null;
        station?: string | null;
        presenting_part?: string | null;
        prom_hours?: string | null;
        ultrasound_1st_date?: string | null;
        ultrasound_1st_aog?: string | null;
        ultrasound_latest_date?: string | null;
        ultrasound_efw?: string | null;
        ultrasound_presentation?: string | null;
        ultrasound_impression?: string | null;
        gravida?: string | null;
        parity?: string | null;
        menarche?: string | null;
        comorbidity?: string | null;
        previous_surgeries?: string | null;
        previous_cs?: string | null;
        lab_result?: string | null;
        xray?: string | null;
        other_diagnostics?: string | null;
      };
    };
    referral_info_diagnostic: {
      Row: {
        id: string;
        created_at: string;
        referral_info: string | null;
        diagnostics: string | null;
        date: string | null;
        attachment: string | null;
        status: boolean | null;
      };
      Insert: {
        id?: string;
        created_at?: string;
        referral_info?: string | null;
        diagnostics?: string | null;
        date?: string | null;
        attachment?: string | null;
        status?: boolean | null;
      };
      Update: {
        id?: string;
        created_at?: string;
        referral_info?: string | null;
        diagnostics?: string | null;
        date?: string | null;
        attachment?: string | null;
        status?: boolean | null;
      };
    };
    referral_info_vaccination: {
      Row: {
        id: string;
        created_at: string;
        referral_info: string | null;
        description: string | null;
        date: string | null;
        status: boolean | null;
      };
      Insert: {
        id?: string;
        created_at?: string;
        referral_info?: string | null;
        description?: string | null;
        date?: string | null;
        status?: boolean | null;
      };
      Update: {
        id?: string;
        created_at?: string;
        referral_info?: string | null;
        description?: string | null;
        date?: string | null;
        status?: boolean | null;
      };
    };
    status: {
      Row: {
        id: string;
        created_at: string;
        description: string | null;
      };
      Insert: {
        id?: string;
        created_at?: string;
        description?: string | null;
      };
      Update: {
        id?: string;
        created_at?: string;
        description?: string | null;
      };
    };
  };
};
