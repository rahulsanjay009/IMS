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
    path('inventory/update_order',views.update_order_items, name='update_order_items'),
    path('inventory/edit_product',views.edit_product, name='edit_product'),
    path('inventory/delete_product',views.delete_product, name='delete_product'),
    path('inventory/send_order_confirmation',views.send_order_confirmation, name='send_order_confirmation'),
    path('inventory/confirm_order_return',views.confirm_order_return, name='confirm_order_return'),
    path('inventory/erase_order',views.order_delete, name='erase_order'),
    path('inventory/recent_events',views.recent_events, name='erase_order'),
    path('inventory/create_recent_event',views.create_recent_event, name='create_recent_event'),
    path('inventory/update_recent_event',views.update_recent_event, name='update_recent_event'),
    path('inventory/delete_recent_event',views.delete_recent_event, name='delete_recent_event'),
    path('inventory/fetch_categories',views.fetch_categories, name='fetch_categories'),
    path('inventory/update_category',views.edit_category,name='edit_category'),
    path('inventory/delete_category',views.delete_category,name='delete_category'),
    path('inventory/new_category',views.add_category,name='new_category')
]
