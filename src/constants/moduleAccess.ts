const env = import.meta.env;

export const MODULE_IDS = {
  module1: env.VITE_MODULE_1_ID,
  module2: env.VITE_MODULE_2_ID,
  module3: env.VITE_MODULE_3_ID,
  module4: env.VITE_MODULE_4_ID,
  module5: env.VITE_MODULE_5_ID,
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