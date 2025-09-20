import jwt from 'jsonwebtoken';

describe('JWT sign & verify', () => {
  const SECRET = 'test-secret';

  it('signs payload and verifies successfully', () => {
    const token = jwt.sign({ email: 'dip.kumar020@gmail.com' }, SECRET, {
      expiresIn: '1h',
    });
    const decoded = jwt.verify(token, SECRET) as any;
    expect(decoded.email).toBe('dip.kumar020@gmail.com');
    expect(decoded.exp).toBeGreaterThan(decoded.iat); // expiry set হয়েছে
  });

  it('throws on expired token', async () => {
    const token = jwt.sign({ sub: 2 }, SECRET, { expiresIn: '1ms' });
    await new Promise((r) => setTimeout(r, 5)); // expire হতে দাও
    expect(() => jwt.verify(token, SECRET)).toThrow();
  });

  it('throws on invalid signature', () => {
    const token = jwt.sign({ sub: 3 }, SECRET, { expiresIn: '1m' });
    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });
});
