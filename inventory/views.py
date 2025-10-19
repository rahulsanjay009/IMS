from .models import Product, Category, Customer, OrderItem , Order, RecentEvents, ProductImage
from django.db import IntegrityError, transaction
from django.db.models import Sum, Q
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .helper import normalize, get_products_with_available_quantity, generate_order_number, upload_image_to_s3, delete_image_from_s3, get_sqs_client

import json
from django.utils.html import  escape
from datetime import datetime
from django.shortcuts import get_object_or_404
from mailjet_rest import Client
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.http import HttpResponse
from urllib.parse import unquote_plus, quote_plus

@api_view(['POST'])
def add_category(request):
    try:
        name = request.POST.get('name')
        image_file = request.FILES.get('image')

        if not name:
            return JsonResponse({"success": False, "error": "Name is required"}, status=200)
        image_url=None
        image_public_id=None
        if(image_file):
            try:
                # upload_result = cloudinary.uploader.upload(image_file)
                # image_url = upload_result.get('secure_url')
                # image_public_id = upload_result.get('public_id')
                image_url, image_public_id = upload_image_to_s3(image_file)
            except Exception as e:
                return JsonResponse({"success": False, "error": "Image not uploaded"}, status=200)

        # Save category with image details
        category = Category(
            name=name,
            image_url=image_url,
            image_public_id=image_public_id
        )
        category.save()

        return JsonResponse({"success": True, "message": "Category added successfully"}, status=201)
    
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@api_view(['GET'])
def fetch_categories(request):
    try:
        categories = Category.objects.all().values('id', 'name', 'image_url', 'image_public_id','s_no').order_by('s_no')
        return JsonResponse({'success': True, 'categories': list(categories)}, status=200)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
@csrf_exempt
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def add_product(request):
    try:
        name = request.data.get('name')
        description = request.data.get('description')
        price = request.data.get('price')
        total_qty = request.data.get('total_qty')
        raw_categories = request.data.get('categories')  # Expecting JSON array
        image_files = request.FILES.getlist('images')  # Multiple files

        if not name or not description or not price or not total_qty or not raw_categories:
            return JsonResponse({"success": False, "message": "Missing required fields."}, status=200)

        if Product.objects.filter(name__iexact=name).exists():
            return JsonResponse({"success": False, "message": "Product with this name already exists."}, status=200)

        try:
            category_list = json.loads(raw_categories)
        except Exception:
            return JsonResponse({"success": False, "message": "Invalid categories format."}, status=200)

        categories = []
        for cat in category_list:
            category = Category.objects.filter(id=cat.get('id')).first()
            if category:
                categories.append(category)

        if not categories:
            return JsonResponse({"success": False, "message": "No valid categories found."}, status=200)

        image_url = None
        image_public_id = None
        product_images = []

        for idx, img_file in enumerate(image_files):
            try:
                uploaded_url, uploaded_public_id = upload_image_to_s3(img_file)
                if idx == 0:
                    image_url = uploaded_url
                    image_public_id = uploaded_public_id
                else:
                    product_images.append((uploaded_url, uploaded_public_id))
            except Exception as e:
                return JsonResponse({"success": False, "message": str(e)}, status=200)

        product = Product(
            name=name,
            description=description,
            price=price,
            total_qty=total_qty,
            image_url=image_url,
            image_public_id=image_public_id
        )
        product.save()

        product.categories.set(categories)

        for url, public_id in product_images:
            ProductImage.objects.create(product=product, image_url=url, image_public_id=public_id)

        return JsonResponse({"success": True, "message": "Product added successfully!", "product": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "total_qty": product.total_qty,
            "description": product.description,
            "image_url": product.image_url,
            "image_public_id": product.image_public_id,
            "categories": list(product.categories.values('id', 'name')),
            "additional_images": list(product.images.values('image_url', 'image_public_id'))
        }}, status=201)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(['GET'])
def product_list(request):
    try:
        category_type = request.GET.get('list', 'ALL').strip()

        if category_type.upper() == 'ALL':
            products = Product.objects.all().order_by('s_no')
        else:
            # Case-insensitive match for category name
            products = Product.objects.filter(categories__name__iexact=category_type).order_by('s_no')

        products = products.distinct()

        product_data = normalize('products', products)

        return JsonResponse({"success": True, 'products': product_data}, status=200)
    except Exception as e:
        return JsonResponse({"success": False, 'error': str(e)}, status=200)

    
@api_view(['POST'])
def get_products_by_ids(request):
    try:
        product_ids = request.data.get('ids', [])

        if not isinstance(product_ids, list):
            return JsonResponse({"success": False, "error": "IDs should be a list"}, status=200)

        products = Product.objects.filter(id__in=product_ids)

        # You can serialize this if needed
        product_data = normalize('products', products)

        return JsonResponse({
            "success": True,
            "products": product_data
        },status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
    
@api_view(['POST'])
def create_category(request):
    try:
        data = json.loads(request.body)
        value = data.get('category',None)
        print(value)
        category = Category(name = value)
        category.save()
        return JsonResponse({"success":True,'message':'Product added successfully!'},status = 201)
    except IntegrityError as e:
        # Check if the error is due to UNIQUE constraint violation
        if 'UNIQUE constraint failed' in str(e):
            return JsonResponse({"success":False, "error": "Category with this name already exists."}, status=200)
        else:
            # Handle any other integrity errors (not related to unique constraint)
            return JsonResponse({"success":False,"error": "An error occurred while creating the category."}, status=200)
    except Exception as e:
        print(e)
        return JsonResponse({"success":False,'error':str(e)},status = 200)

@api_view(['GET']) 
def get_categories(request):
    try:
        result_set = Category.objects.all().order_by('s_no')
        categories = normalize('categories',result_set)
        return JsonResponse({"success":True,"categories":categories},status = 200)
    except Exception as e:
        return JsonResponse({"success":False,'error':str(e)},status = 200)


@api_view(['POST'])
def add_order(request):
    try:
        data = json.loads(request.body)
        customer_name = data.get("customer_name")
        customer_phone = data.get("customer_phone")
        customer_email = data.get("customer_email")
        from_date = data.get("from_date")
        to_date = data.get("to_date")
        is_paid = data.get("paid").lower() == "true"  # Convert to boolean
        products_data = data.get("products", [])
        is_returned = False
        comments = data.get("comments", None)
        event_date=data.get("event_date",None)
        is_delivery_required = data.get("is_delivery_required",None)
        delivery_address = data.get("delivery_address",None)

        # Step 1: Check if customer exists by phone number
        customer, created = Customer.objects.get_or_create(
            phone=customer_phone,
            defaults={"full_name": customer_name, "email": customer_email}
        )
        
        if created:
            print(f"New customer created: {customer_name} ({customer_phone})")
        else:
            print(f"Existing customer found: {customer_name} ({customer_phone})")
            customer.full_name = customer_name
            customer_email = customer_email
            customer.save()

        # Step 2: Create Order
        try:
            date_from = datetime.strptime(from_date, "%Y-%m-%d %H:%M:%S")
            date_to = datetime.strptime(to_date, "%Y-%m-%d %H:%M:%S")
            event_date = datetime.strptime(event_date,"%Y-%m-%d")
        except ValueError as e:
            return JsonResponse({"success": False, "error": f"Invalid date format: {str(e)}"}, status=200)
        
        # Generate unique order number (you can also create a custom way of generating order number)
        order_number = generate_order_number(customer_phone, customer_name)
        
        # Start the atomic transaction to ensure atomicity
        with transaction.atomic():
            # Create the order object within the atomic block
            order = Order.objects.create(
                number=order_number,
                date_from=date_from,
                date_to=date_to,
                is_paid=is_paid,
                customer=customer,
                comments=comments,
                is_returned=is_returned,
                event_date = event_date,
                is_delivery_required = is_delivery_required,
                address = delivery_address
            )
            
            # Step 3: Create OrderItems for each product
            for product_data in products_data:            
                product_id = product_data.get("product_id", None)
                quantity = int(product_data.get("quantity"))            

                # Retrieve the product (assuming the name is unique, if not, you may need another way to identify products)
                try:
                    product = Product.objects.get(id=product_id)
                except Product.DoesNotExist:
                    # Rollback the transaction if product is not found
                    transaction.set_rollback(True)
                    return JsonResponse({"success": False, "error": f"Product '{product_id}' not found."}, status=200)
                
                # Calculate the total ordered quantity for this product in the date range
                overlapping_orders = OrderItem.objects.filter(
                    product=product,
                    order__date_from__lte=date_to,  
                    order__date_to__gte=date_from   
                ).exclude(order__is_returned = True)

                # Calculate the sum of ordered quantities for overlapping orders
                ordered_qty_in_range = overlapping_orders.aggregate(Sum('ordered_qty'))['ordered_qty__sum'] or 0
                
                # Available quantity is the total quantity minus the ordered quantity
                available_qty = product.total_qty - ordered_qty_in_range

                # If the ordered quantity exceeds the available quantity, return an error
                if available_qty < quantity:
                    # Rollback the transaction if there is insufficient stock
                    transaction.set_rollback(True)
                    return JsonResponse({"success": False, "error": f"Not enough stock for product '{product.name}'. \n Available: {available_qty}, requested: {quantity}"}, status=200)

                # Create the OrderItem
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    ordered_qty=quantity
                )

        return JsonResponse({"success": True, "message": "Order has been placed successfully!"}, status=200)

    except Exception as e:
        # Any exception will trigger a rollback and return an error
        return JsonResponse({"success": False, "error": str(e)}, status=200)


@api_view(['GET'])
def get_orders(request):
    try:
        orders_type = request.GET.get('type',1)
        result_set = Order.objects.select_related('customer').all().order_by('-date_from')
        order_list = normalize('orders',result_set, orders_type)
        return JsonResponse({"success":True,"orders":order_list},status = 200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=200)
    

@api_view(['POST'])
def check_product_availability(request):
    try:
        data = json.loads(request.body)
        print(data)
        from_date_time = data.get('from',None)
        to_date_time = data.get('to',None)
        if from_date_time is None or to_date_time is None:
            return JsonResponse({"success": False, "error": 'Dates are invalid'}, status=400)
        try:
            date_from = datetime.strptime(from_date_time, "%Y-%m-%d %H:%M:%S")
            date_to = datetime.strptime(to_date_time, "%Y-%m-%d %H:%M:%S")
        except ValueError as e:
            return JsonResponse({"success": False, "error": f"Invalid date format: {str(e)}"}, status=400)
        
        result_data = get_products_with_available_quantity(date_from,date_to)

        return JsonResponse({'success':True, 'availableProducts': result_data},status = 200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=200)
    

@api_view(['POST'])
def update_order_items(request):
    try:
        data = request.data
        order_id = data.get("id")
        items_data = data.get("items", [])
        comments = data.get("comments")

        if not order_id:
            return JsonResponse({"success": False, "error": "Order ID is required"}, status=200)

        order = get_object_or_404(Order, id=order_id)

        from_date = order.date_from
        to_date = order.date_to

        incoming_product_ids = set(item["product_id"] for item in items_data if "product_id" in item)

        try:
            updated = Order.objects.update(comments=comments)
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        with transaction.atomic():
            
            current_order_items = OrderItem.objects.filter(order=order)

            # Remove items not in the update
            for order_item in current_order_items:
                if order_item.product.id not in incoming_product_ids:
                    order_item.delete()

            for item_data in items_data:
                product_id = item_data.get("product_id")
                quantity = item_data.get("quantity")
                price = item_data.get("price")
                
                if not product_id or quantity is None or price is None:
                    return JsonResponse({
                        "success": False,
                        "error": "Product ID, quantity, and price are required for each item"
                    }, status=200)

                product = get_object_or_404(Product, id=product_id)

                # Get all orders with overlapping dates (excluding the current one)
                overlapping_orders = OrderItem.objects.filter(
                    product=product,
                    order__date_from__lte=to_date,
                    order__date_to__gte=from_date
                ).exclude(Q(order=order) | Q(order__is_returned = True))

                # Sum up total quantity already ordered during that time
                ordered_qty_in_range = overlapping_orders.aggregate(Sum('ordered_qty'))['ordered_qty__sum'] or 0
                
                # Check if there's enough stock left
                available_qty = product.total_qty - ordered_qty_in_range
                if available_qty < quantity:
                    return JsonResponse({
                        "success": False,
                        "error": f"Not enough stock for product '{product.name}' during the selected period. \n Available: {available_qty}, requested: {quantity}"
                    }, status=200)

                # Update or create the item
                order_item, created = OrderItem.objects.get_or_create(
                    order=order,
                    product=product,
                    defaults={'ordered_qty': quantity}
                )

                if not created:
                    order_item.ordered_qty = quantity                    
                    order_item.save()
                print(data)
        return JsonResponse({"success": True, "message": "Order items updated successfully!"}, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def edit_category(request):
    try:
        category_id = request.data.get('id')
        new_name = request.data.get('name')
        image_file = request.FILES.get('image')
        s_no = request.data.get('s_no', None)

        category = Category.objects.get(id=category_id)

        # Update name if provided
        if new_name:
            category.name = new_name

        # Handle image update
        if image_file:
            # Delete old image from Cloudinary
            if category.image_public_id:
                delete_image_from_s3(category.image_public_id)
            
            category.image_url,category.image_public_id = upload_image_to_s3(image_file)
        # Handle s_no update and potential swap
        swapped_category_id = None
        if s_no is not None and s_no != category.s_no:
            existing = Category.objects.filter(s_no=s_no).exclude(id=category.id).first()
            if existing:
                # Step 1: assign a temp value to existing to free up the desired s_no
                swapped_category_id= existing.id
                temp_s_no = -1  # must be a value that never exists
                existing.s_no = temp_s_no
                existing.save()

                temp_s_no = category.s_no
                # Step 2: assign desired s_no to category
                category.s_no = s_no
                category.save()

                # Step 3: assign original category.s_no to existing
                existing.s_no = temp_s_no
                existing.save()
            else:
                category.s_no = s_no
        category.save()
        return JsonResponse({'success': True, 
                             'category': {
                                 'id': category.id,
                                 'name': category.name,
                                 'image_url': category.image_url,
                                 'image_public_id': category.image_public_id,
                                 's_no': category.s_no
                             },
                             'swapped_with': {"category_id":swapped_category_id, "s_no":s_no} if swapped_category_id else None,
                             'message': 'Category updated successfully'}, status=200)

    except Category.DoesNotExist:
        print("Error editing category: Category not found")
        return JsonResponse({'success': False, 'error': 'Category not found'}, status=404)
    except Exception as e:
        print("Error editing category:", str(e))
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
@csrf_exempt
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def edit_product(request):
    try:
        product_id = request.data.get("id")
        name = request.data.get('name')
        description = request.data.get('description')
        price = request.data.get('price')
        total_qty = request.data.get('total_qty')
        s_no = request.data.get('s_no', None)

        main_image_file = request.FILES.get('image')  # newly uploaded main image
        main_image_public_id = request.data.get('image_public_id')  # existing main image public ID

        new_additional_images = request.FILES.getlist('additional_images')  # new uploads
        existing_additional_image_ids = request.data.getlist('existing_additional_images[]')  # keep these

        raw_categories = request.data.get('categories')
        raw_removed_images = request.data.get('removed_images')

        # Parse categories
        try:
            category_list = json.loads(raw_categories) if raw_categories else []
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid categories format"}, status=400)

        # Parse removed image IDs
        try:
            removed_image_public_ids = json.loads(raw_removed_images) if raw_removed_images else []
        except json.JSONDecodeError:
            removed_image_public_ids = []

        # Required fields check
        if not product_id or not name or not price or total_qty is None:
            return JsonResponse({"success": False, "error": "Missing required fields"}, status=400)

        product = get_object_or_404(Product, id=product_id)
        product.name = name
        product.description = description
        product.price = price
        product.total_qty = total_qty
        # 🌟 Main image logic
        if main_image_file:
            if product.image_public_id:
                try:
                    print(f"Deleting old image: {product.image_public_id}")
                    delete_image_from_s3(product.image_public_id)
                except Exception as e:
                    print(f"S3 deletion error: {str(e)}")
            product.image_url, product.image_public_id = upload_image_to_s3(main_image_file)

        swapped_product_id = None
        swapped_product_sno = product.s_no
        if s_no is not None and s_no != product.s_no:
            existing = Product.objects.filter(s_no=s_no).exclude(id=product.id).first()
            if existing:
                # Step 1: assign a temp value to existing to free up the desired s_no
                swapped_product_id = existing.id
                temp_s_no = -1  # must be a value that never exists
                existing.s_no = temp_s_no
                existing.save()

                temp_s_no = product.s_no
                # Step 2: assign desired s_no to product
                product.s_no = s_no
                product.save()

                # Step 3: assign original product.s_no to existing
                existing.s_no = temp_s_no
                existing.save()
            else:
                product.s_no = s_no

        product.save()

        # ✅ Update categories
        category_ids = [c.get('id') for c in category_list if c.get('id')]
        categories_qs = Category.objects.filter(id__in=category_ids)
        product.categories.set(categories_qs)

        # 🧹 Delete removed images (explicit only)
        if removed_image_public_ids:
            # Delete additional images
            images_to_delete = ProductImage.objects.filter(product=product, image_public_id__in=removed_image_public_ids)
            for img in images_to_delete:
                try:
                    delete_image_from_s3(img.image_public_id)
                except Exception as e:
                    print(f"S3 deletion error: {str(e)}")
                img.delete()

            # Check if main image is among removed images
            if product.image_public_id in removed_image_public_ids:
                try:
                    delete_image_from_s3(product.image_public_id)
                except Exception as e:
                    print(f"S3 deletion error (main image): {str(e)}")
                product.image_public_id = None
                product.image_url = ''
                product.save()


        # 🔄 Sync additional images — only if list provided
        if 'existing_additional_images[]' in request.data:
            ProductImage.objects.filter(
                product=product
            ).exclude(
                image_public_id__in=existing_additional_image_ids
            ).delete()

        # ➕ Add new additional images
        for img in new_additional_images:
            img_url, img_public_id = upload_image_to_s3(img)
            ProductImage.objects.create(
                product=product,
                image_url=img_url,
                image_public_id=img_public_id
            )

        return JsonResponse({
        "success": True,
        "message": "Product updated successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "total_qty": product.total_qty,
            "description": product.description,
            "image_url": product.image_url,
            "image_public_id": product.image_public_id,
            "categories": list(product.categories.values('id', 'name')),
            "additional_images": list(product.images.values('image_url', 'image_public_id')),
            "s_no": product.s_no
        },
        "swapped_with": {"product_id":swapped_product_id, "s_no":swapped_product_sno} if swapped_product_id else None
        }, status=200)

    except Exception as e:
        print("Error editing product:", str(e))
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(['POST'])
def delete_category(request):
    try:
        data = json.loads(request.body)
        category_id = data.get('id')

        if not category_id:
            return JsonResponse({'success': False, 'error': 'Category ID is required'}, status=400)

        category = Category.objects.get(id=category_id)

        # Delete Cloudinary image
        if category.image_public_id:                          
            delete_image_from_s3(category.image_public_id)

        category.delete()
        return JsonResponse({'success': True, 'message': 'Category deleted successfully'}, status=200)

    except Category.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Category not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@api_view(['POST'])
def delete_product(request):
    try:
        data = json.loads(request.body)
        product_id = data.get("product_id")

        if not product_id:
            return JsonResponse({"success": False, "error": "Product ID is required"}, status=400)

        product = get_object_or_404(Product, id=product_id)

        # Delete all additional images (ProductImage)
        for image in product.images.all():
            if image.image_public_id:
                try:
                    delete_image_from_s3(image.image_public_id)
                except Exception as e:
                    return JsonResponse({
                        "success": False,
                        "error": f"Error deleting image '{image.image_public_id}' from S3: {str(e)}"
                    }, status=500)

        # Delete main product image
        if product.image_public_id:
            try:
                delete_image_from_s3(product.image_public_id)
            except Exception as e:
                return JsonResponse({
                    "success": False,
                    "error": f"Error deleting main image from S3: {str(e)}"
                }, status=500)

        # Finally, delete the product and all related ProductImage records
        product.delete()

        return JsonResponse({"success": True, "message": "Product and all images deleted successfully"}, status=200)

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

@api_view(['POST'])
def send_order_confirmation(request):
    order_id = request.data.get("order_id")
    email = request.data.get('email',None)
    print(order_id, email)
    order = get_object_or_404(Order, id=order_id)
    pickup_date = order.date_from
    dropoff_date = order.date_to
    comments = escape(order.comments or "")
    order_number = order.number
    customer_email = order.customer.email if order.customer.email not in [None,''] else email

    order_items = OrderItem.objects.filter(order=order)

    order_template = f"""
        <p>Thank you for placing the order. Please review the order details and call us if you would like to modify your order.</p>
        <h3>Order: {order_number}</h3>
        <h4>Confirmed Pick Up on {pickup_date.strftime( "%d %b, %Y %H:%M")} and Drop Off on {dropoff_date.strftime( "%d %b,%Y %H:%M")}</h4>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
            <thead>
                <tr>
                    <th colspan="2">Product Name</th>
                    <th>Quantity</th> 
                </tr>
            </thead>
            <tbody>
    """

    for item in order_items:
        product_name = escape(item.product.name)
        ordered_qty = item.ordered_qty
        order_template += f"""
            <tr>
                <td colspan="2">{product_name}</td>
                <td>{ordered_qty}</td>
            </tr>
        """

    order_template += f"""
            </tbody>
        </table>
        <p>Comments: {comments}</p>
    """

    subject = f'Your Order Confirmed: {order_number}'
    from_email = 'rahul.sanjay009@gmail.com'

    try:
        mailjet = Client(auth=(settings.API_KEY,settings.SECRET_API_KEY))
        data = {
            'FromEmail':from_email,
            'FromName':'Rahul',
            'Subject': subject,
            'Text-part':'Thanks for placing the order',
            'HTML-part': order_template,
            'Recipients':[{'Email': customer_email}]
        }
        result = mailjet.send.create(data = data)
        return JsonResponse({"success": True, "message": f"Order confirmation sent successfully {result.status_code}"}, status=200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(['POST'])
def confirm_order_return(request):
    try:
        data = json.loads(request.body)
        order_id = data.get('order_id')
        if not order_id:
            return JsonResponse({'success':False,'error': 'Missing order_id'}, status=200)

        order = Order.objects.filter(id=order_id)
        if not order.exists():
            return JsonResponse({'success':False,'error': 'Order not found'}, status=200)

        order.update(is_returned=True)
        return JsonResponse({'success':True,'message': 'Order marked as returned'}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'success':False,'error': 'Invalid JSON'}, status=500)
    except Exception as e:
        return JsonResponse({'success':False,'error': str(e)}, status=500)



@api_view(['POST'])
def order_delete(request):
    data = json.loads(request.body)
    order_id = data.get("order_id")

    try:
        order = Order.objects.get(id=order_id)
        order.delete()
        return JsonResponse({'success': True, 'message': 'Order deleted'}, status=200)
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)
    


@csrf_exempt
def create_recent_event(request):
    if request.method == 'POST':
        try:
            event_name = request.POST.get('event_name')
            event_description = request.POST.get('event_description')
            image_url = ''
            image_public_id = ''
            
            if 'image' in request.FILES:
                try:
                    image_file = request.FILES['image']
                    image_url, image_public_id = upload_image_to_s3(image_file)
                except e:
                    return JsonResponse({'success':False,'error': 'Image not able to upload'}, status=200)
            
            event = RecentEvents.objects.create(
                event_name=event_name,
                event_description=event_description,
                image_url=image_url,
                image_public_id=image_public_id
            )
            return JsonResponse({'success': True, 'event': {
                    'id': event.id,
                    'event_name': event.event_name,
                    'event_description': event.event_description,
                    'image_url': event.image_url,
                    'image_public_id': event.image_public_id
                }})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})


@csrf_exempt
def update_recent_event(request):
    if request.method == 'POST':
        try:
            event_id = request.POST.get('id',None)
            event = RecentEvents.objects.get(id=event_id)

            event.event_name = request.POST.get('event_name', event.event_name)
            event.event_description = request.POST.get('event_description', event.event_description)

            if 'image' in request.FILES:
                if event.image_public_id:
                    try:
                        delete_image_from_s3(event.image_public_id)
                    except e:
                        return JsonResponse({'success':False,'error': 'Existing image not able to deleted'}, status=200)
                image_file = request.FILES['image']
                
                event.image_url, event.image_public_id = upload_image_to_s3(image_file)
                # event.image_url = upload_result.get('secure_url')
                # event.image_public_id = upload_result.get('public_id')

            event.save()
            return JsonResponse({'success': True, 'event': {
                    'id': event.id,
                    'event_name': event.event_name,
                    'event_description': event.event_description,
                    'image_url': event.image_url,
                    'image_public_id': event.image_public_id
                }})
        except RecentEvents.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Event not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})


@csrf_exempt
def delete_recent_event(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            event_id = data.get('id',None)
            event = RecentEvents.objects.get(id=event_id)
            
            if event.image_public_id:
                delete_image_from_s3(event.image_public_id)
            
            event.delete()
            return JsonResponse({'success': True, 'message':'Event Deleted Succesfully'})
        except RecentEvents.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Event not found'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})



@api_view(['GET'])
def recent_events(request):
    events = RecentEvents.objects.all().order_by('-id')
    event_list = [{
        "id": event.id,
        "event_name": event.event_name,
        "event_description": event.event_description,
        "image_url": event.image_url,
        "image_public_id": event.image_public_id
    } for event in events]
    return JsonResponse({"success": True, "events": event_list})

@api_view(['GET'])
def latest_products(request):
    try:
        products = Product.objects.order_by('-created_at')[:10]
        
        product_data = [
            {
                "id": str(product.id),
                "name": product.name,
                "description": product.description,
                "price": float(product.price),
                "total_qty": product.total_qty,
                "category": product.category.name if product.category else None,
                "image_url": product.image_url,
            }
            for product in products
        ]

        return JsonResponse({'success':True,'message':'Products fetched Succesfully','products':product_data},status =200)
    except Exception as e:
        return JsonResponse({'success':False,'error':f'Fetch error latest products {str(e)}'},status =500)
    

@csrf_exempt # Only for development, handle CSRF properly in production
def send_sqs_message(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            message_body = data.get('order_details')

            if not message_body:
                return JsonResponse({'error': 'Message body is required'}, status=400)

            sqs = get_sqs_client()
            queue_url = 'https://sqs.us-east-2.amazonaws.com/878126142668/Srikrishnapartyrentalsllc-order-notifications' 

            message_body_str = json.dumps(message_body) 
            response = sqs.send_message(
                QueueUrl=queue_url,
                MessageBody=message_body_str
            )
            return JsonResponse({'success':True,'messageId': response['MessageId']}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'success':False,'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            print(e)
            return JsonResponse({'success':False,'error': str(e)}, status=500)
    return JsonResponse({'success':False,'error': 'Only POST requests are allowed'}, status=405)

def send_sms_view(request):
    encoded_message = request.GET.get('message', '')
    phoneNumber = request.GET.get('phoneNumber', '')
    message = unquote_plus(encoded_message)

    # URL-encode message again for embedding in href
    href_message = quote_plus(message)

    sms_href = f"sms:{phoneNumber}?body={href_message}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Send SMS</title>
    </head>
    <body>
        <h2>Send Text Message</h2>
        <p>
            Click the link below to open your SMS app with the pre-filled message:<br/><br/>
            <a href="{sms_href}">contact via iMessage</a>
        </p>
    </body>
    </html>
    """

    return HttpResponse(html_content)