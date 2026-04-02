import os
import uuid
import logging
from datetime import datetime
from fastapi import UploadFile, HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_r2_client():
    """Devuelve el cliente R2 desde settings."""
    if not settings.r2_client:
        raise HTTPException(500, "R2 no está inicializado")
    return settings.r2_client

def upload_file_to_r2(file: UploadFile, prefix: str) -> str:
    """
    Sube un archivo a Cloudflare R2 y devuelve la URL pública.
    Organiza en carpetas: diagnosticos/{año}/{mes}/{día}/{prefix}_{uuid}.ext
    """
    if not settings.r2_client:
        raise HTTPException(500, "Servicio de almacenamiento no disponible")

    now = datetime.now()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    day = now.strftime("%d")
    ext = os.path.splitext(file.filename)[1]
    unique_id = uuid.uuid4().hex
    safe_prefix = prefix.replace('[', '_').replace(']', '_').replace('/', '_')
    key = f"diagnosticos/{year}/{month}/{day}/{safe_prefix}_{unique_id}{ext}"

    try:
        # Subir a R2
        settings.r2_client.upload_fileobj(
            file.file,
            settings.R2_BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": file.content_type or "image/jpeg"}
        )
        # Construir URL pública
        public_url = f"{settings.R2_PUBLIC_URL}/{key}"
        logger.info(f"Archivo subido a R2: {public_url}")
        return public_url
    except Exception as e:
        logger.error(f"Error subiendo a R2: {e}")
        raise HTTPException(500, f"No se pudo subir el archivo: {e}")

def delete_file_from_r2(file_url: str) -> bool:
    """
    Elimina un archivo de R2 dada su URL pública.
    Extrae la key de la URL y la borra.
    """
    if not settings.r2_client:
        return False
    try:
        # La URL pública tiene formato: https://.../diagnosticos/2025/04/02/...
        # Extraemos la parte después del dominio
        prefix = settings.R2_PUBLIC_URL
        if file_url.startswith(prefix):
            key = file_url[len(prefix):].lstrip('/')
            settings.r2_client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
            logger.info(f"Archivo eliminado: {key}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error eliminando archivo {file_url}: {e}")
        return False