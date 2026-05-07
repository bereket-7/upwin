import axios from 'axios';

describe('Auth API guards', () => {
  it('rejects profile access without a JWT', async () => {
    await expect(axios.get('/api/auth/profile')).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });
  });
});
