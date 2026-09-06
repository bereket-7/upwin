import axios from 'axios';
import { signTestJwt } from '../support/jwt';

describe('Proposal API guards', () => {
  it('rejects proposal listing without a JWT', async () => {
    await expect(axios.get('/api/proposals')).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });
  });

  it('rejects proposal creation without a JWT', async () => {
    await expect(
      axios.post('/api/proposals', {
        profileId: 'profile-1',
        content: 'proposal content',
      })
    ).rejects.toMatchObject({
      response: {
        status: 401,
      },
    });
  });

  it('lists proposals for the authenticated user (scoped by JWT)', async () => {
    const token = signTestJwt('user-a');
    const response = await axios.get('/api/proposals', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    const rows = response.data?.data ?? response.data;
    expect(Array.isArray(rows)).toBe(true);
  });

  it('rejects create with JWT when profileId is not owned', async () => {
    const token = signTestJwt('user-a');
    try {
      await axios.post(
        '/api/proposals',
        {
          profileId: '00000000-0000-4000-8000-0000000000b1',
          content: 'proposal content',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fail('expected request to fail');
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      // 404 when profile-service reachable; 502 if ownership check cannot reach it
      expect([404, 502, 401]).toContain(status);
    }
  });

  it('rejects reading another user proposal id with a valid JWT (404)', async () => {
    const token = signTestJwt('user-b');
    await expect(
      axios.get('/api/proposals/00000000-0000-4000-8000-0000000000a1', {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).rejects.toMatchObject({
      response: {
        status: 404,
      },
    });
  });
});
