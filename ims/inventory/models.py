from django.db import models
import uuid


class Category(models.Model):
    name = models.CharField(max_length = 255, unique=True)
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    image_url = models.URLField(null = True, blank = True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['name'], name='unique_category_name', condition=models.Q(name__iexact=models.F('name')))
        ]
    def __str__(self):
        return self.name
    
class Product(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    name = models.CharField(max_length = 255, unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits = 5 , decimal_places = 2)
    total_qty = models.IntegerField()
    category = models.ForeignKey(Category, on_delete = models.SET_NULL, null = True, blank = True)
    image_url = models.URLField(null = True, blank = True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)


    def __str__(self):
        return self.name
    
class Customer(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    full_name = models.CharField(max_length = 255)
    phone = models.CharField(max_length = 10, unique=True)
    email = models.EmailField()

    def __str__(self):
        return f'{self.full_name} ({self.phone})'

    
class Order(models.Model):
    number = models.DecimalField(max_digits=65, decimal_places=0, editable=False)
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date_from = models.DateTimeField()
    date_to = models.DateTimeField()
    is_paid = models.BooleanField()
    comments = models.TextField()
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    is_returned = models.BooleanField()
    is_delivery_required = models.BooleanField()
    event_date = models.DateField()
    address = models.TextField(null=True, blank=True)

    def __str__(self):
        return str(self.number)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    ordered_qty = models.IntegerField()

    def __str__(self):
        return f'{self.order} x {self.product.name}'
    
class RecentEvents(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_name = models.TextField(null=True)
    image_url = models.URLField(null = True, blank = True)
    image_public_id = models.CharField(max_length=255, blank=True, null=True)
    event_description = models.TextField(null=True)
    def __str__(self):
        return f'{self.event_name} x {self.image_public_id}'
    
    