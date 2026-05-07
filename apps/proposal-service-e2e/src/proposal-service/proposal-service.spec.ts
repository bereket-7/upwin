import axios from 'axios';

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
});
