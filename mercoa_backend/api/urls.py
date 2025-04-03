from django.urls import path
from .views import get_mercoa_token, login_view, create_entity, signup, list_invoices, create_invoice 

urlpatterns = [
    path("login/", login_view),
    path("signup/", signup),      
    path("entity/create/", create_entity),
    path("invoices/", list_invoices),
    path("invoices/create/", create_invoice),
    path("mercoa/token/", get_mercoa_token),
]
