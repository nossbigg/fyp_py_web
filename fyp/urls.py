from django.conf.urls import url, include

from views import api, views

urlpatterns = [
    # Views
    url(r'^$', views.index),

    # Web Services
    url(r'^api/', include([
        url(r'^datasets_info', api.get_datasets_info),
        url(r'^ml_tests_info', api.get_ml_tests_info),
    ])),
]
