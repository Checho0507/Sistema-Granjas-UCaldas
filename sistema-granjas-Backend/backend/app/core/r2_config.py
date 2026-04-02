# app/core/r2_config.py
from app.core.config import settings

def get_r2_client():
    """Retorna el cliente R2 desde settings."""
    if not hasattr(settings, 'r2_client') or settings.r2_client is None:
        # Intentar inicializar si no lo está
        settings.init_storage()
    return settings.r2_client

def get_r2_bucket():
    """Retorna el nombre del bucket R2."""
    return settings.R2_BUCKET_NAME