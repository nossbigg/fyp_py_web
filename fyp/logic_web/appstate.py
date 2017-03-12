from controller.config import Config
from controller.database_service import DatabaseService
from django.conf import settings


class AppState:
    config = Config(settings.LOGIC_BASE_DIR + '/config/config.ini')
    dbs = DatabaseService(config)

    def __init__(self):
        pass
