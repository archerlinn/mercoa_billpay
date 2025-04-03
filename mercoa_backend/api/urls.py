from django.urls import path
from .views import login_view, create_entity, signup  # ⬅️ Add signup here

urlpatterns = [
    path("login/", login_view),
    path("signup/", signup),      
    path("entity/create/", create_entity),
]
