import axios from 'axios';
import { signTestJwt } from '../support/jwt';

describe('Profile API guards', () => {
  it('rejects profile-by-id access without a JWT', async () => {
    await expect(axios.get('/api/profile/profile-1')).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });
  });

  it('rejects access to another user profile id with a valid JWT (404)', async () => {
    const token = signTestJwt('user-a');
    await expect(
      axios.get('/api/profile/00000000-0000-4000-8000-0000000000b1', {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).rejects.toMatchObject({
      response: {
        status: 404,
      },
    });
  });
});
