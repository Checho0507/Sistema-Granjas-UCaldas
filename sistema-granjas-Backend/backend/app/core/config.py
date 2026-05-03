import json
import ssl
import logging
from pydantic_settings import BaseSettings
from typing import Dict, List, Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    GOOGLE_CLIENT_ID: str = ""

    UPLOAD_DIR: str = "app/uploads"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY: str = ""
    R2_SECRET_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_ENDPOINT: str = ""
    R2_PUBLIC_URL: str = ""

    ROLES_POR_DEFECTO: Optional[Dict] = None
    ROLES_PERMITIDOS_REGISTRO: Optional[List[str]] = None
    GRANJAS_PREDEFINIDAS: Optional[List[Dict]] = None
    PROGRAMAS_AGRICOLAS: Optional[List[Dict]] = None
    PROGRAMAS_PECUARIOS: Optional[List[Dict]] = None

    class Config:
        env_file = ".env"
        extra = "allow"

    def init_storage(self):
        if not self.R2_ENDPOINT or not self.R2_ACCESS_KEY or not self.R2_SECRET_KEY:
            logger.warning("R2 credentials not configured - file uploads will be unavailable")
            self.r2_client = None
            return False

        try:
            import boto3
            from botocore.config import Config as BotoConfig

            s3_config = BotoConfig(
                region_name="auto",
                signature_version='s3v4',
                connect_timeout=10,
                read_timeout=30,
                retries={'max_attempts': 3},
                s3={'addressing_style': 'virtual'}
            )

            session = boto3.Session()
            self.r2_client = session.client(
                's3',
                endpoint_url=self.R2_ENDPOINT,
                aws_access_key_id=self.R2_ACCESS_KEY,
                aws_secret_access_key=self.R2_SECRET_KEY,
                config=s3_config
            )

            response = self.r2_client.list_buckets()
            logger.info(f"R2 connected. Buckets: {len(response['Buckets'])}")
            return True

        except Exception as e:
            logger.error(f"R2 initialization error: {e}")
            self.r2_client = None
            return False


settings = Settings()

def parse_json_field(value, default=None):
    if not value:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value.replace("'", '"'))
        except json.JSONDecodeError:
            return default
    return value

settings.ROLES_POR_DEFECTO = parse_json_field(settings.ROLES_POR_DEFECTO, {})
settings.ROLES_PERMITIDOS_REGISTRO = parse_json_field(settings.ROLES_PERMITIDOS_REGISTRO, [])
settings.GRANJAS_PREDEFINIDAS = parse_json_field(settings.GRANJAS_PREDEFINIDAS, [])
settings.PROGRAMAS_AGRICOLAS = parse_json_field(settings.PROGRAMAS_AGRICOLAS, [])
settings.PROGRAMAS_PECUARIOS = parse_json_field(settings.PROGRAMAS_PECUARIOS, [])

logger.info("Initializing R2 storage...")
storage_success = settings.init_storage()

if storage_success:
    logger.info("R2 storage ready")
else:
    logger.warning("R2 storage not available - uploads will fail")
