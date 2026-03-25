# backend/services/__init__.py
from .vsellm_client import VseLLMClient, vsellm_client

__all__ = ['VseLLMClient', 'vsellm_client']