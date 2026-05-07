import axios from 'axios';

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
});
