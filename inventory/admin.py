from django.contrib import admin
from .models import Product, Order, Customer, Category, OrderItem, RecentEvents, ProductImage

admin.site.register(Product)
admin.site.register(Order)
admin.site.register(Customer)
admin.site.register(Category)
admin.site.register(OrderItem)
admin.site.register(RecentEvents)
admin.site.register(ProductImage)