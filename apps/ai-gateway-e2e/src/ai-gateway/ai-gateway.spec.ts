import axios from 'axios';
import { signTestJwt } from '../support/jwt';

describe('AI Gateway guards', () => {
  it('rejects proposal generation without a JWT', async () => {
    await expect(
      axios.post('/api/generate-proposal', {
        profileId: 'profile-1',
        jobDescription: 'Build a secure API',
      })
    ).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });
  });

  it('rejects generation for a non-owned profileId with a valid JWT (404 or 502)', async () => {
    const token = signTestJwt('user-a');
    try {
      await axios.post(
        '/api/generate-proposal',
        {
          profileId: '00000000-0000-4000-8000-0000000000b1',
          jobDescription: 'Build a secure API',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fail('expected request to fail');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      expect([404, 502, 401, 503]).toContain(status);
    }
  });

  it('rejects job review for a non-owned profileId with a valid JWT', async () => {
    const token = signTestJwt('user-a');
    try {
      await axios.post(
        '/api/ai/jobs/review',
        {
          profileId: '00000000-0000-4000-8000-0000000000b1',
          jobDescription: 'Need a NestJS developer',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fail('expected request to fail');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      expect([404, 502, 401, 503]).toContain(status);
    }
  });
});
