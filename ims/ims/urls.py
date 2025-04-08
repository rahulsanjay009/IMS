"""
URL configuration for ims project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from inventory import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('inventory/create_product',views.add_product,name="add_product"),
    path('inventory/create_category',views.create_category,name="add_category"),
    path('inventory/products',views.product_list, name='product_list'),
    path('inventory/categories',views.get_categories, name='get_categories'),
    path('inventory/create_order',views.add_order, name='add_order'),
    path('inventory/orders',views.get_orders, name='get_orders'),
    path('inventory/check_product_availability',views.check_product_availability, name='check_product_availability'),
]
