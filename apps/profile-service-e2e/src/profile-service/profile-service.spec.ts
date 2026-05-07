import axios from 'axios';

describe('Profile API guards', () => {
  it('rejects profile-by-id access without a JWT', async () => {
    await expect(axios.get('/api/profile/profile-1')).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });
  });
});
