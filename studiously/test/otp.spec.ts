const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

describe('OTP format & expiry logic', () => {
  it('generates a 6-digit numeric OTP', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('expiry window: 5 minutes', () => {
    const createdAt = new Date();
    const ttlMs = 5 * 60 * 1000; // 5 min
    const expiresAt = new Date(createdAt.getTime() + ttlMs);

    const withinWindow = new Date(createdAt.getTime() + 4 * 60 * 1000);
    const afterWindow = new Date(createdAt.getTime() + 6 * 60 * 1000);

    // ৪ মিনিটে valid, ৬ মিনিটে invalid
    expect(withinWindow.getTime() <= expiresAt.getTime()).toBe(true);
    expect(afterWindow.getTime() > expiresAt.getTime()).toBe(true);
  });
});
