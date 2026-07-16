import time
from typing import Dict, Tuple

class TokenBucketRateLimiter:
    def __init__(self, rate: float, capacity: float):
        self.rate = rate  # tokens added per second
        self.capacity = capacity  # max tokens in bucket
        self.buckets: Dict[str, Tuple[float, float]] = {}  # ip -> (tokens, last_update_time)

    def is_rate_limited(self, ip: str) -> bool:
        now = time.time()
        if ip not in self.buckets:
            self.buckets[ip] = (self.capacity, now)
            return False

        tokens, last_update = self.buckets[ip]
        # Add tokens based on elapsed time
        elapsed = now - last_update
        tokens = min(self.capacity, tokens + elapsed * self.rate)
        
        if tokens < 1.0:
            self.buckets[ip] = (tokens, now)
            return True

        self.buckets[ip] = (tokens - 1.0, now)
        return False

# 10 requests capacity, refills at 1 request every 2 seconds (0.5 tokens/sec)
upload_limiter = TokenBucketRateLimiter(rate=0.5, capacity=10.0)
