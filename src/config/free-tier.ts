// Free tier. 2 credits is one Nano Banana 2.1 image. Free credits are image-only and expire.
export const FREE_TIER = {
  credits: 2,
  expiresDays: 14,
  /** Most free grants allowed from one network address in 24 hours. */
  perIpPerDay: 3,
} as const;

/** Name of the cookie that marks a browser as one device. */
export const DEVICE_COOKIE = "sb_device";
