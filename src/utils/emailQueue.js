import logger from '../config/logger.js';

class EmailQueue {
  constructor(concurrencyLimit = 2, delayMs = 1000) {
    this.queue = [];
    this.isProcessing = false;
    this.concurrencyLimit = concurrencyLimit;
    this.delayMs = delayMs;
  }

  enqueue(jobFn) {
    this.queue.push(jobFn);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    
    // Take up to concurrencyLimit jobs
    const batch = this.queue.splice(0, this.concurrencyLimit);
    
    try {
      await Promise.allSettled(batch.map(job => job()));
    } catch (error) {
      logger.error('Error processing email queue batch: ' + error.message);
    }

    // Wait before processing the next batch to avoid rate limits
    setTimeout(() => {
      this.processQueue();
    }, this.delayMs);
  }
}

// Global instance of the queue
export const emailQueue = new EmailQueue();
