/**
 * Proposal Streaming Client for Chrome Extension
 * 
 * Usage:
 * const streamer = new ProposalStreamer('http://localhost:3007/api');
 * streamer.streamProposal(profileId, jobDescription, callbacks);
 */

class ProposalStreamer {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.abortController = null;
  }

  /**
   * Stream a proposal from the AI Gateway
   * 
   * @param {string} profileId - Profile UUID
   * @param {string} jobDescription - Job description text
   * @param {Object} options - Streaming options
   * @param {string} options.userId - User identifier
   * @param {string} options.tone - Tone override (professional, friendly, etc.)
   * @param {string} options.length - Length preference (short, medium, long)
   * @param {string} options.style - Writing style override
   * @param {Function} options.onChunk - Callback for each text chunk
   * @param {Function} options.onComplete - Callback when streaming completes
   * @param {Function} options.onError - Callback for errors
   * @returns {Promise<string>} - Complete proposal text
   */
  async streamProposal(profileId, jobDescription, options = {}) {
    this.abortController = new AbortController();

    const requestBody = {
      userId: options.userId || 'user-123',
      profileId,
      jobDescription,
      tone: options.tone,
      length: options.length,
      style: options.style,
    };

    let fullProposal = '';

    try {
      const response = await fetch(`${this.apiUrl}/ai/proposals/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              if (options.onComplete) {
                options.onComplete(fullProposal);
              }
              return fullProposal;
            }
            
            fullProposal += data;
            
            if (options.onChunk) {
              options.onChunk(data, fullProposal);
            }
          } else if (line.startsWith('event: error')) {
            // Error event detected, next line has error message
            continue;
          } else if (line.startsWith('event: done')) {
            if (options.onComplete) {
              options.onComplete(fullProposal);
            }
            return fullProposal;
          }
        }
      }

      return fullProposal;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Streaming cancelled by user');
      } else if (options.onError) {
        options.onError(error);
      }
      throw error;
    }
  }

  /**
   * Cancel the current streaming request
   */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

// Example Usage 1: Basic streaming
async function example1() {
  const streamer = new ProposalStreamer('http://localhost:3007/api');

  let proposal = '';

  await streamer.streamProposal(
    'profile-uuid-123',
    'We need a full-stack developer to build a React and Node.js application with PostgreSQL database.',
    {
      userId: 'user-456',
      tone: 'professional',
      length: 'medium',
      onChunk: (chunk, fullText) => {
        proposal = fullText;
        console.log('New chunk:', chunk);
        // Update UI
        document.getElementById('proposal').textContent = fullText;
      },
      onComplete: (finalProposal) => {
        console.log('Streaming complete!');
        console.log('Final proposal length:', finalProposal.length);
      },
      onError: (error) => {
        console.error('Streaming error:', error);
        alert('Failed to generate proposal: ' + error.message);
      },
    }
  );
}

// Example Usage 2: With cancellation
async function example2() {
  const streamer = new ProposalStreamer('http://localhost:3007/api');

  // Start streaming
  const streamPromise = streamer.streamProposal(
    'profile-uuid-123',
    'Build a mobile app...',
    {
      onChunk: (chunk) => console.log(chunk),
      onComplete: () => console.log('Done!'),
    }
  );

  // Cancel after 5 seconds
  setTimeout(() => {
    console.log('Cancelling stream...');
    streamer.cancel();
  }, 5000);

  try {
    await streamPromise;
  } catch (error) {
    console.log('Stream was cancelled or failed');
  }
}

// Example Usage 3: Chrome Extension Integration
class ProposalGenerator {
  constructor() {
    this.streamer = new ProposalStreamer('http://localhost:3007/api');
    this.currentProposal = '';
  }

  async generateProposal(profileId, jobDescription) {
    // Show loading state
    this.updateUI({ loading: true, proposal: '' });

    try {
      await this.streamer.streamProposal(profileId, jobDescription, {
        userId: await this.getUserId(),
        tone: await this.getUserPreference('tone'),
        onChunk: (chunk, fullText) => {
          this.currentProposal = fullText;
          this.updateUI({ loading: true, proposal: fullText });
        },
        onComplete: (finalProposal) => {
          this.currentProposal = finalProposal;
          this.updateUI({ loading: false, proposal: finalProposal });
          this.saveToHistory(finalProposal);
        },
        onError: (error) => {
          this.updateUI({ loading: false, error: error.message });
        },
      });
    } catch (error) {
      console.error('Generation failed:', error);
    }
  }

  updateUI(state) {
    // Send message to extension popup/content script
    chrome.runtime.sendMessage({
      type: 'PROPOSAL_UPDATE',
      data: state,
    });
  }

  async getUserId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['userId'], (result) => {
        resolve(result.userId || 'anonymous');
      });
    });
  }

  async getUserPreference(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key]);
      });
    });
  }

  saveToHistory(proposal) {
    chrome.storage.local.get(['proposalHistory'], (result) => {
      const history = result.proposalHistory || [];
      history.unshift({
        proposal,
        timestamp: Date.now(),
      });
      chrome.storage.local.set({ proposalHistory: history.slice(0, 10) });
    });
  }

  cancelGeneration() {
    this.streamer.cancel();
    this.updateUI({ loading: false, proposal: this.currentProposal });
  }
}

// Export for use in Chrome Extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProposalStreamer, ProposalGenerator };
}
