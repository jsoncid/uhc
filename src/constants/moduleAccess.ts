const env = import.meta.env;

/**
 * Page-level module IDs from the database.
 * Each maps to a specific page's module UUID in the `modules` table.
 */
export const PAGE_MODULE_IDS = {
  // Module 1 - Queueing pages
  module1_QG: env.VITE_module_1_QG_page,
  module1_SQM: env.VITE_module_1_SQM_page,
  module1_Admin: env.VITE_module_1_admin_page,
  module1_QD: env.VITE_module_1_QD_page,

  // Module 2 - Referral pages
  module2_ReferralManagement: env['VITE_Module2-ReferralManagement'],
  module2_IncomingReferrals: env['VITE_Module2-IncomingRefferals'],
  module2_ReferralHistory: env['VITE_Module2-RefferalHistory'],

  // Module 3 - Patient Repository pages
  module3_PatientProfiling: env['VITE_Module3-PatientProfiling'],
  module3_PatientTagging: env['VITE_Module3-PatientTagging'],

  // Module 4 - Health Card pages
  module4_HealthCardHolder: env['VITE_Module4-HealthCardHolder'],
  module4_HealthCardOperator: env['VITE_Module4-HealthCardOperator'],

  // Module 5
  module5: env.VITE_MODULE_5_ID,
};

/**
 * Page-level module description names.
 * These MUST match the `module.description` column in your Supabase `modules` table.
 * Used by sidebar filtering, ModuleRoute guards, and checkAccess() calls.
 */
export const PAGE_MODULES = {
  // Module 1 - Queueing pages
  MODULE_1_QG: 'Module 1 - Queue Generator',
  MODULE_1_SQM: 'Module 1 - Staff Queue Manager',
  MODULE_1_ADMIN: 'Module 1 - Admin',
  MODULE_1_QD: 'Module 1 - Queue Display',

  // Module 2 - Referral pages
  MODULE_2_REFERRAL_MANAGEMENT: 'Module 2 - Referral Management',
  MODULE_2_INCOMING_REFERRALS: 'Module 2 - Incoming Referrals',
  MODULE_2_REFERRAL_HISTORY: 'Module 2 - Referral History',

  // Module 3 - Patient Repository pages
  MODULE_3_PATIENT_LIST: 'Module 3 - Patient List',
  MODULE_3_PATIENT_PROFILING: 'Module 3 - Patient Profiling',
  MODULE_3_PATIENT_TAGGING: 'Module 3 - Patient Tagging',

  // Module 4 - Health Card pages
  MODULE_4_HEALTH_CARD_HOLDER: 'Module 4 - Health Card Holder',
  MODULE_4_HEALTH_CARD_OPERATOR: 'Module 4 - Health Card Operator',

  // Module 5 - OCR pages
  MODULE_5_OCR: 'Module 5 - OCR',
};

export const ROLE_IDS = {
  administrator: env.VITE_ADMINISTRATOR_ID,
  encoder: env.VITE_ENCODER_ID,
  infoOfficer: env.VITE_INFO_OFFICER_ID,
  infoUser: env.VITE_INFO_USER_ID,
  module1Admin: env.VITE_MODULE_1_ADMIN,
  module4Operator: env.VITE_MODULE_4_OPERATOR,
  module4Member: env.VITE_MODULE_4_MEMBER,
};