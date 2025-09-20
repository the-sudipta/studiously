import * as bcrypt from 'bcrypt';

describe('bcrypt password hashing', () => {
  it('hashes and verifies password', async () => {
    const plain = '0testPass@';
    const hash = await bcrypt.hash(plain, 10);

    await expect(bcrypt.compare(plain, hash)).resolves.toBe(true);
    await expect(bcrypt.compare('wrongPass', hash)).resolves.toBe(false);
  });
});
