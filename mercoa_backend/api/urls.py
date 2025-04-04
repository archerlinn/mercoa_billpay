from django.urls import path
from .views import get_mercoa_token, login_view, create_entity, signup
from .views import list_invoices, create_invoice, update_invoice, approve_invoice
from .views import create_entity_user, list_entity_users, update_entity_user, delete_entity_user
from .views import create_approval_policy, list_approval_policies, update_approval_policy, delete_approval_policy
from .views import create_payment_method_schema, list_payment_method_schemas, delete_payment_method_schema
from .views import list_vendors, ap_aging_report

urlpatterns = [
    path("login/", login_view),
    path("signup/", signup),      
    path("entity/create/", create_entity),
    path("invoices/", list_invoices),
    path("invoices/create/", create_invoice),
    path("invoices/update/", update_invoice),
    path("invoice/approve/", approve_invoice),
    path("mercoa/token/", get_mercoa_token),
    path('entity/user/create/', create_entity_user),
    path('entity/user/list/', list_entity_users, name='list_entity_users'),
    path("entity/user/update/", update_entity_user),
    path("entity/user/delete/", delete_entity_user),
    path("entity/approval-policy/create/", create_approval_policy),
    path("entity/approval-policy/list/", list_approval_policies),
    path("entity/approval-policy/update/", update_approval_policy),
    path("entity/approval-policy/delete/", delete_approval_policy),
    path('payment-method/schema/create/', create_payment_method_schema),
    path("payment-method/schema/list/", list_payment_method_schemas),
    path("payment-method/schema/delete/", delete_payment_method_schema),
    path("vendors/list/", list_vendors),
    path('aging-report/', ap_aging_report, name='ap_aging_report'),
]

