from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import Request

# Simple in-memory rate limiter
# In production, use Redis or similar
request_counts = defaultdict(list)

def check_rate_limit(
    request: Request,
    max_requests: int = 10,
    window_minutes: int = 1
) -> bool:
    """
    Check if request from client IP is within rate limit
    """
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.now()
    window_start = now - timedelta(minutes=window_minutes)
    
    # Remove old requests outside of window
    request_counts[client_ip] = [
        timestamp for timestamp in request_counts[client_ip]
        if timestamp > window_start
    ]
    
    # Check if limit exceeded
    if len(request_counts[client_ip]) >= max_requests:
        return False
    
    # Add current request
    request_counts[client_ip].append(now)
    return True
