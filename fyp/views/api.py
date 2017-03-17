from controller.data_info_service import DataInfoService
from django.http import JsonResponse

from fyp.logic_web.appstate import AppState

ap = AppState()
dis = DataInfoService(ap.dbs, ap.config)


def get_datasets_info(request):
    data = dis.get_all_statistics()

    return JsonResponse(data, json_dumps_params={'indent': 2})


def get_ml_tests_info(request):
    data = dis.get_all_ml_results()

    return JsonResponse(data, json_dumps_params={'indent': 2})


def get_data_collection(request):
    data = dis.get_all_ml_results()

    return JsonResponse(data, json_dumps_params={'indent': 2})
