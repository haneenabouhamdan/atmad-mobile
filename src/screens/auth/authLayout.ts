/** Shared layout for signup / sign-in screens — column centers on tablet widths */
export const AUTH_COLUMN_MAX = 420;

export const authColumnStyle = {
  width: "100%" as const,
  maxWidth: AUTH_COLUMN_MAX,
  alignSelf: "center" as const,
};
