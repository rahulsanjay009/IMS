from .models import Order, OrderItem, Product
from django.db.models import Sum
import hashlib
import time
from boto3.session import Session
import boto3
from django.conf import settings
import uuid
from PIL import Image
import io

def get_orders_by_type(data, current_orders):
    result_data = []    
    for order in data:
            if order.is_returned is current_orders:
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

def normalize(type,data,orders_type = 1):
    result_data = []
    if type == 'products':        
        for product in data:
            result_data.append({
                'id': str(product.id),  # Convert UUID to string to ensure it's serializable
                'name': product.name,
                'description': product.description,
                'price': str(product.price),  # Convert Decimal to string to avoid issues
                'total_qty': product.total_qty,
                'image_url': product.image_url,
                'image_public_id': product.image_public_id,
                'created_at': product.created_at,
                'categories': [{'name':category.name, 'id':category.id} for category in product.categories.all()] or ['No category'],  # M2M field
                'additional_images' : [{'image_url': image.image_url, 'image_public_id': image.image_public_id} for image in product.images.all()],
                's_no': product.s_no
            })
    elif type == 'categories':
         for category in data:
              result_data.append({"name":category.name, "s_no":category.s_no})
    elif type == 'orders':    
        if int(orders_type) == 1:
            result_data = get_orders_by_type(data, False)
        else:
            result_data = get_orders_by_type(data, True)            
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

def compress_image(image_file, target_size_kb=200, force_jpeg_if_large=True):
    image = Image.open(image_file)
    original_format = image.format or 'PNG'
    is_transparent = image.mode in ('RGBA', 'LA') or (
        image.mode == 'P' and 'transparency' in image.info
    )

    # Rewind to calculate original size
    image_file.seek(0)
    image_file.seek(0)

    if force_jpeg_if_large and (original_format == 'PNG' and not is_transparent):
        image = image.convert('RGB')
        output_format = 'JPEG'
    elif force_jpeg_if_large and is_transparent:
        background = Image.new("RGB", image.size, (255, 255, 255))
        image = image.convert("RGBA")
        background.paste(image, mask=image.split()[3])
        image = background
        output_format = 'JPEG'
    else:
        output_format = original_format

    buffer = io.BytesIO()
    quality = 85 if output_format == 'JPEG' else None
    min_quality = 30

    while True:
        buffer.seek(0)
        buffer.truncate()

        if output_format == 'JPEG':
            image.save(buffer, format='JPEG', quality=quality, optimize=True)
        elif output_format == 'PNG':
            image.save(buffer, format='PNG', optimize=True, compress_level=9)

        size_kb = buffer.tell() / 1024
        if size_kb <= target_size_kb or (quality is not None and quality <= min_quality):
            break

        if output_format == 'JPEG':
            quality -= 5

    buffer.seek(0)
    return buffer, output_format



def upload_image_to_s3(image_file, force_jpeg=False):
    compressed_buffer, fmt = compress_image(image_file)

    # Fix content type if format changed (e.g. PNG converted to JPEG)
    if force_jpeg or (image_file.content_type == 'image/png' and fmt == 'JPEG'):
        content_type = 'image/jpeg'
    else:
        content_type = image_file.content_type

    key = f'images/{uuid.uuid4().hex}_{image_file.name}'

    session = Session(
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    s3_client = session.client('s3')

    s3_client.upload_fileobj(
        Fileobj=compressed_buffer,
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
        ExtraArgs={
            'ContentType': content_type,
            'CacheControl': 'public, max-age=31536000, immutable'
        }
    )

    image_url = f'https://{settings.AWS_S3_CUSTOM_DOMAIN}/{key}'
    return image_url, key


def delete_image_from_s3(key):
    try:
        boto3_s3 = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                ) 
        boto3_s3.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
        return True
    except Exception as e:
        # You may log this error instead of failing the entire request
        print(f"Failed to delete image from S3: {e}")
        return False
    
def get_sqs_client():
    try:
        sqs = boto3.client('sqs', region_name=settings.AWS_S3_REGION_NAME)
        return sqs
    except Exception as e:
        # In a real-world app, you might want more robust logging here
        print(f"Error initializing SQS client: {e}") 
        return None