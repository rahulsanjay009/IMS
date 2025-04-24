from .models import Order, OrderItem, Product
from django.db.models import Sum
import hashlib
import time


def normalize(type,data):
    result_data = []
    if(type == 'products'):        
        for product in data:
                result_data.append({
                    'id': str(product.id),  # Convert UUID to string to ensure it's serializable
                    'name': product.name,
                    'description': product.description,
                    'price': str(product.price),  # Convert Decimal to string to avoid issues
                    'total_qty': product.total_qty,
                    'category': product.category.name if product.category else 'No category',  # Handle missing category
                })
    elif type == 'categories':
         for category in data:
              result_data.append(category.name)
    elif type == 'orders':
        for order in data:
            if order.is_returned is False:
                # Get order items
                items = []
                for item in order.items.all():
                    items.append({
                        'product_name': item.product.name,
                        'quantity': item.ordered_qty,
                        'price': str(item.product.price),
                        'product_id': str(item.product.id),
                    })

                result_data.append({
                    'order_id': str(order.id),
                    'order_number': str(order.number),
                    'customer_name': order.customer.full_name if order.customer else 'null',
                    'customer_phone': order.customer.phone if order.customer else 'null',
                    'is_paid': order.is_paid,
                    'from_date': order.date_from,
                    'to_date': order.date_to,
                    'comments': order.comments,
                    'event_date':order.event_date,
                    'is_delivery_required' : order.is_delivery_required,
                    'address':order.address,
                    'items': items  # <- Add items inside the order
                })
    return result_data


def get_products_with_available_quantity(date_from, date_to):
    # Step 1: Get all products
    all_products = Product.objects.all()

    # Step 2: Filter orders within the date range and aggregate ordered quantities for each product
    orders_in_range = Order.objects.filter(date_from__lte=date_to, date_to__gte=date_from, is_returned = False)
    order_items = OrderItem.objects.filter(order__in=orders_in_range)
    
    ordered_quantities = order_items.values('product') \
        .annotate(total_ordered_qty=Sum('ordered_qty')) \
        .values('product', 'total_ordered_qty')

    # Create a dictionary to store the total ordered quantities for each product
    ordered_qty_dict = {item['product']: item['total_ordered_qty'] for item in ordered_quantities}

    # Step 3: Calculate available quantity for each product
    products_with_available_quantity = []
    for product in all_products:
        # Get the ordered quantity for this product from the dictionary (default to 0 if not found)
        total_ordered_qty = ordered_qty_dict.get(product.id, 0)
        available_qty = product.total_qty - total_ordered_qty
        
        # Append product info with available quantity
        products_with_available_quantity.append({
            'product_id': product.id,
            'available_qty': available_qty
        })
    
    return products_with_available_quantity


def generate_order_number(phone, name):
    timestamp = str(int(time.time()))  
    source_str = f"{phone}_{name}_{timestamp}"
    hash_obj = hashlib.sha256(source_str.encode())
    hash_int = int(hash_obj.hexdigest(), 16)
    
    # Ensure the number is 10 digits
    order_number = hash_int % 10_000_000_000
    return str(order_number).zfill(10)  # Pad with leading zeros if needed

