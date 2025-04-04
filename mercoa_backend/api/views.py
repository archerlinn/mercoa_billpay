import json
import os
import base64
import requests
import traceback
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from .models import Profile
from django.conf import settings

from datetime import datetime, timezone
from dateutil.parser import parse as parse_date

MERCOA_API_KEY = "4956c7d4b2944b8aa656a2ae8b604732"
MERCOA_API_URL = "https://api.mercoa.com/entity"
UPLOAD_DIR = "uploads/"
User = get_user_model()


def make_headers():
    return {
        "Authorization": f"Bearer {MERCOA_API_KEY}",
        "Content-Type": "application/json"
    }

@csrf_exempt
def get_mercoa_token(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
        email = data.get("email")

        user = User.objects.get(username=email)
        profile = user.profile

        if not profile.entity_id:
            return JsonResponse({"status": "error", "message": "Entity not onboarded"}, status=400)

        url = f"https://api.mercoa.com/entity/{profile.entity_id}/token"
        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        res = requests.post(url, headers=headers, json={})
        res.raise_for_status()

        print("📨 Mercoa token raw response:", res.text)

        token = res.text.strip('"')  # ✅ just clean the raw string
        return JsonResponse({"status": "success", "token": token})

    except requests.exceptions.HTTPError as api_err:
        print("❌ Mercoa API Error:", api_err)
        print("🔍 Mercoa Response:", res.text if 'res' in locals() else "No response")
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API failed",
            "details": str(api_err),
            "response": res.text if 'res' in locals() else None,
        }, status=res.status_code if 'res' in locals() else 500)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

def save_base64_file(base64_string, filename, upload_dir=UPLOAD_DIR):
    try:
        format, imgstr = base64_string.split(';base64,')
        ext = format.split('/')[-1]
        file_bytes = base64.b64decode(imgstr)

        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, f"{filename}.{ext}")

        with open(file_path, 'wb') as f:
            f.write(file_bytes)

        return file_path
    except Exception as e:
        print(f"❌ Error while saving {filename}: {e}")
        raise ValueError(f"Error saving {filename}: {e}")

@csrf_exempt
def signup(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return JsonResponse({"status": "error", "message": "Email and password required."}, status=400)

        user, created = User.objects.get_or_create(
            username=email,
            defaults={"password": make_password(password)},
        )

        if not created:
            return JsonResponse({"status": "exists"}, status=400)

        Profile.objects.get_or_create(user=user)
        return JsonResponse({"status": "created"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"status": "error", "message": "Username and password required."}, status=400)

        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            profile, _ = Profile.objects.get_or_create(user=user)
            return JsonResponse({
                "status": "ok",
                "entity_id": profile.entity_id,
                "entity_name": profile.entity_name,
                "entity_logo": profile.entity_logo,
            })
        return JsonResponse({"status": "invalid"}, status=401)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

@csrf_exempt
def create_entity(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    try:
        data = json.loads(request.body)
        email = data.get("email")
        if not email:
            return JsonResponse({"status": "error", "message": "Email required."}, status=400)

        try:
            user = User.objects.get(username=email)
            profile, _ = Profile.objects.get_or_create(user=user)
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found."}, status=400)

        # ✅ If already onboarded
        if profile.entity_id:
            return JsonResponse({
                "status": "already_onboarded",
                "entity_id": profile.entity_id,
                "entity_name": profile.entity_name,
                "entity_logo": profile.entity_logo,
            })

        # Optional base64 file save
        def try_save(key, filename):
            try:
                return save_base64_file(data[key], filename) if data.get(key) else None
            except Exception as e:
                print(f"⚠️ Skipping {key} due to error: {e}")
                return None

        logo_path = try_save("logo", "logo")
        w9_path = try_save("w9", "w9")
        form1099_path = try_save("form1099", "form1099")
        bank_statement_path = try_save("bankStatement", "bank_statement")

        payload = {
            "isCustomer": True,
            "isPayor": True,
            "isPayee": False,
            "accountType": "business",
            "foreignId": data.get("foreignId"),
            "profile": {
                "business": {
                    "email": data.get("email"),
                    "legalBusinessName": data.get("legalBusinessName"),
                    "website": data.get("website"),
                    "businessType": data.get("businessType", "llc").lower(),
                    "phone": {
                        "countryCode": "1",
                        "number": data.get("phone")
                    },
                    "address": {
                        "addressLine1": data["address"].get("addressLine1"),
                        "addressLine2": data["address"].get("addressLine2"),
                        "city": data["address"].get("city"),
                        "stateOrProvince": data["address"].get("stateOrProvince"),
                        "postalCode": data["address"].get("postalCode"),
                        "country": data["address"].get("country", "US")
                    },
                    "taxId": {
                        "ein": {
                            "number": data.get("ein")
                        }
                    }
                }
            }
        }

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        res = requests.post(MERCOA_API_URL, headers=headers, json=payload)
        if res.status_code != 200:
            print("❌ Mercoa API Error:", res.status_code, res.text)
            return JsonResponse({
                "status": "error",
                "message": "Mercoa API error",
                "details": res.text
            }, status=res.status_code)

        response_data = res.json()
        entity_id = response_data.get("id")

        if not entity_id:
            print("❌ Missing entityId in response:", response_data)
            return JsonResponse({
                "status": "error",
                "message": "Mercoa API did not return entityId",
                "raw_response": response_data
            }, status=500)

        profile.entity_id = entity_id
        profile.entity_name = data.get("legalBusinessName", "")
        profile.entity_logo = data.get("logo", "")
        profile.save()

        return JsonResponse({
            "status": "success",
            "entity_id": entity_id,
            "saved_files": {
                "logo": logo_path,
                "w9": w9_path,
                "form1099": form1099_path,
                "bankStatement": bank_statement_path
            }
        })

    except requests.exceptions.RequestException as api_err:
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API request failed.",
            "details": str(api_err)
        }, status=500)

    except Exception as general_err:
        traceback.print_exc()
        return JsonResponse({
            "status": "error",
            "message": f"Unexpected error: {str(general_err)}"
        }, status=500)

@csrf_exempt
def list_invoices(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")

        if not entity_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id"}, status=400)

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        # ✅ Correct endpoint
        url = f"https://api.mercoa.com/entity/{entity_id}/invoices"
        res = requests.get(url, headers=headers)
        res.raise_for_status()

        invoices = res.json()
        print("📄 Invoices:", invoices)

        return JsonResponse({"status": "success", "invoices": invoices})

    except requests.exceptions.RequestException as e:
        print("❌ Invoice fetch failed:", e)
        print("🔍 Response:", res.text if 'res' in locals() else "No response")
        return JsonResponse({
            "status": "error",
            "message": "API request failed",
            "details": str(e),
            "response": res.text if 'res' in locals() else None
        }, status=500)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def create_invoice(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)

        required_fields = ["status", "payerId", "creatorEntityId", "payeeId", "dueDate", "lineItems"]
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({"status": "error", "message": f"Missing required field: {field}"}, status=400)

        payload = {
            "status": data["status"],
            "payerId": data["payerId"],
            "creatorEntityId": data["creatorEntityId"],
            "vendorId": data["payeeId"],  # Mercoa expects vendorId not payeeId
            "dueDate": data["dueDate"],
            "invoiceDate": data.get("invoiceDate", data["dueDate"]),
            "memo": data.get("memo", ""),
            "noteToSelf": data.get("noteToSelf", ""),
            "invoiceNumber": data.get("invoiceNumber", ""),
            "currency": data.get("currency", "USD"),
            "lineItems": data["lineItems"],
            "foreignId": data.get("foreignId"),
            "paymentSourceId": data.get("paymentSourceId"),
            "paymentDestinationId": data.get("paymentDestinationId"),
            "paymentDestinationOptions": data.get("paymentDestinationOptions"),
        }

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        res = requests.post("https://api.mercoa.com/invoice", headers=headers, json=payload)
        res.raise_for_status()
        return JsonResponse({"status": "success", "invoice": res.json()})

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error", "message": "Mercoa API error", "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)
    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def create_entity_user(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")
        email = data.get("email")
        name = data.get("name", "")
        roles = data.get("roles", ["admin"])  # must be a list

        payload = {
            "email": email,
            "name": name,
            "foreignId": email,
            "roles": roles
        }

        res = requests.post(
            f"https://api.mercoa.com/entity/{entity_id}/user",
            headers={
                "Authorization": f"Bearer {MERCOA_API_KEY}",
                "Content-Type": "application/json"
            },
            data=json.dumps(payload)
        )

        res.raise_for_status()
        return JsonResponse({"status": "success", "user": res.json()})

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API error",
            "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
def list_entity_users(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")

        if not entity_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id"}, status=400)

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        url = f"https://api.mercoa.com/entity/{entity_id}/users"
        res = requests.get(url, headers=headers)
        res.raise_for_status()

        return JsonResponse({
            "status": "success",
            "users": res.json()
        })

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error",
            "message": "API request failed",
            "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def update_entity_user(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")
        user_id = data.get("user_id")
        email = data.get("email")
        name = data.get("name")
        roles = data.get("roles", [])

        if not entity_id or not user_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id or user_id"}, status=400)

        payload = {
            "email": email,
            "name": name,
            "roles": roles,
            "foreignId": email,  # You can customize this if needed
        }

        url = f"https://api.mercoa.com/entity/{entity_id}/user/{user_id}"
        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        print("📥 Incoming data:", data)
        print("🔗 POST URL:", url)
        print("📦 POST payload:", payload)

        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()

        return JsonResponse({"status": "success", "user": res.json()})

    except requests.exceptions.RequestException as e:
        print("❌ Mercoa API error:", e)
        print("🔍 Response:", e.response.text if e.response else "No response")
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API error",
            "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def delete_entity_user(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")
        user_id = data.get("user_id")

        if not entity_id or not user_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id or user_id"}, status=400)

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        url = f"https://api.mercoa.com/entity/{entity_id}/user/{user_id}"
        res = requests.delete(url, headers=headers)
        res.raise_for_status()

        return JsonResponse({"status": "success", "message": "User deleted"})

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API error",
            "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def create_approval_policy(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)

        entity_id = data.get("entity_id")
        amount = data.get("amount")
        currency = data.get("currency", "USD")
        roles = data.get("roles", [])  # e.g. ["admin", "controller"]
        num_approvers = data.get("num_approvers", 1)

        if not entity_id or not amount or not roles:
            return JsonResponse({"status": "error", "message": "Missing required fields"}, status=400)

        payload = {
            "trigger": [
                {
                    "type": "amount",
                    "amount": amount,
                    "currency": currency,
                }
            ],
            "rule": {
                "type": "approver",
                "numApprovers": num_approvers,
                "identifierList": {
                    "type": "rolesList",
                    "value": roles
                }
            },
            "upstreamPolicyId": "root"
        }

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        url = f"https://api.mercoa.com/entity/{entity_id}/approval-policy"
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()

        return JsonResponse({"status": "success", "policy": res.json()})

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API error",
            "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def list_approval_policies(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")

        if not entity_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id"}, status=400)

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        url = f"https://api.mercoa.com/entity/{entity_id}/approval-policies"  # ← ✅ this must end with -policies
        res = requests.get(url, headers=headers)
        res.raise_for_status()

        return JsonResponse({"status": "success", "policies": res.json()})

    except requests.exceptions.RequestException as e:
        print("❌ Mercoa API error:", str(e))
        print("🔍 Response:", e.response.text if e.response else "No response")
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API error",
            "details": str(e),
            "response": e.response.text if e.response else None,
        }, status=500)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def update_approval_policy(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")
        policy_id = data.get("policy_id")
        amount = data.get("amount")
        currency = data.get("currency", "USD")
        roles = data.get("roles", [])
        num_approvers = data.get("num_approvers", 1)

        if not all([entity_id, policy_id]):
            return JsonResponse({"status": "error", "message": "Missing entity_id or policy_id"}, status=400)

        payload = {
            "trigger": [{
                "type": "amount",
                "amount": amount,
                "currency": currency
            }],
            "rule": {
                "type": "approver",
                "numApprovers": num_approvers,
                "identifierList": {
                    "type": "rolesList",
                    "value": roles
                }
            },
            "upstreamPolicyId": "root"
        }

        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        url = f"https://api.mercoa.com/entity/{entity_id}/approval-policy/{policy_id}"
        print("📦 PATCH payload:", payload)
        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()

        return JsonResponse({"status": "success", "policy": res.json()})

    except requests.exceptions.RequestException as e:
        print("❌ Mercoa PATCH error:", e)
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API error",
            "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
def delete_approval_policy(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    
    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")
        policy_id = data.get("policy_id")

        if not entity_id or not policy_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id or policy_id"}, status=400)

        url = f"https://api.mercoa.com/entity/{entity_id}/approval-policy/{policy_id}"
        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        res = requests.delete(url, headers=headers)
        res.raise_for_status()
        return JsonResponse({"status": "success", "message": "Policy deleted"})

    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "status": "error", "message": "Mercoa API error", "details": str(e),
            "response": e.response.text if e.response else None
        }, status=500)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def update_invoice(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
        invoice_id = data.get("invoice_id")
        if not invoice_id:
            return JsonResponse({"status": "error", "message": "Missing invoice_id"}, status=400)

        print("📥 Received update payload:", data)

        # Mercoa requires a full invoice object to update
        payload = {
            "status": "NEW",
            "amount": data["amount"],
            "currency": data["currency"],
            "invoiceDate": data["invoiceDate"],
            "dueDate": data["dueDate"],
            "invoiceNumber": data["invoiceNumber"],
            "noteToSelf": data["noteToSelf"],
            "memo": data["memo"],
            "payerId": data["payerId"],
            "vendorId": data["vendorId"],
            "creatorEntityId": data["creatorEntityId"],
        }

        # Only include if provided and non-empty
        if data.get("paymentSourceId"):
            payload["paymentSourceId"] = data["paymentSourceId"]

        if data.get("paymentDestinationId"):
            payload["paymentDestinationId"] = data["paymentDestinationId"]

        if data.get("creatorUserId"):
            payload["creatorUserId"] = data["creatorUserId"]

        if data.get("lineItems"):
            payload["lineItems"] = data["lineItems"]

        print("🔧 Sending update to Mercoa:", payload)

        headers = make_headers()
        url = f"https://api.mercoa.com/invoice/{invoice_id}"

        res = requests.post(url, headers=headers, json=payload)
        res.raise_for_status()

        return JsonResponse({
            "status": "success",
            "invoice": res.json()
        })

    except requests.exceptions.HTTPError as e:
        print("❌ Mercoa API error:", e)
        print("🔍 Response:", e.response.text if e.response else "No response")
        return JsonResponse({
            "status": "error",
            "message": "Mercoa API error",
            "details": str(e),
            "response": e.response.text if e.response else None
        }, status=e.response.status_code if e.response else 500)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@csrf_exempt
def create_payment_method_schema(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)

    try:
        payload = json.loads(request.body)
        print("📥 Received schema creation payload:", payload)

        # Validate required keys
        required_keys = ["name", "isSource", "isDestination", "fields"]
        missing_keys = [key for key in required_keys if key not in payload]
        if missing_keys:
            return JsonResponse({"status": "error", "message": f"Missing fields: {', '.join(missing_keys)}"}, status=400)

        # Mercoa request
        api_url = "https://api.mercoa.com/paymentMethod/schema"
        headers = make_headers()

        response = requests.post(api_url, headers=headers, json=payload)
        if response.status_code in [200, 201]:
            return JsonResponse({"status": "success", "schema": response.json()}, status=201)
        else:
            print("❌ Mercoa API error:", response.status_code, response.text)
            return JsonResponse({
                "status": "error",
                "message": "Mercoa API error",
                "details": response.text
            }, status=response.status_code)

    except json.JSONDecodeError:
        return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)
    except Exception as e:
        print("🔥 Exception:", str(e))
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def list_payment_method_schemas(request):
    if request.method != "GET":
        return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)
    
    try:
        headers = make_headers()
        response = requests.get("https://api.mercoa.com/paymentMethod/schema", headers=headers)
        
        if response.status_code == 200:
            return JsonResponse({"status": "success", "schemas": response.json()})
        else:
            return JsonResponse({
                "status": "error",
                "message": "Mercoa API error",
                "details": response.text
            }, status=response.status_code)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def delete_payment_method_schema(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        schema_id = data.get("schema_id")
        if not schema_id:
            return JsonResponse({"status": "error", "message": "Missing schema_id"}, status=400)

        print(f"🗑️ Deleting schema: {schema_id}")
        url = f"https://api.mercoa.com/paymentMethod/schema/{schema_id}"
        response = requests.delete(url, headers=make_headers())

        if response.status_code in [200, 204]:
            return JsonResponse({"status": "success", "message": "Schema deleted"})
        else:
            print("❌ Mercoa API error:", response.status_code, response.text)
            return JsonResponse({"status": "error", "message": "Mercoa API error", "details": response.text}, status=500)

    except Exception as e:
        print("❌ Exception during deletion:", str(e))
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def approve_invoice(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        invoice_id = data.get("invoice_id")

        if not invoice_id:
            return JsonResponse({"status": "error", "message": "Missing invoice_id"}, status=400)

        # 💡 Use your Mercoa business account user ID here
        user_id = "user_abcdef123456"  # Replace with dynamic lookup if needed

        url = f"https://api.mercoa.com/invoice/{invoice_id}/approve"

        headers = make_headers()
        payload = {
            "userId": user_id
        }

        response = requests.post(url, headers=headers, json=payload)

        if response.status_code == 200:
            return JsonResponse({"status": "success"})
        else:
            print("❌ Approval API error:", response.status_code, response.text)
            return JsonResponse({
                "status": "error",
                "message": "Mercoa API error",
                "details": response.text
            }, status=response.status_code)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def list_vendors(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")

        if not entity_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id"}, status=400)

        url = f"https://api.mercoa.com/entity/{entity_id}/counterparty"
        headers = make_headers()

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        return JsonResponse({"status": "success", "vendors": response.json()})

    except requests.exceptions.RequestException as e:
        print("❌ Mercoa API Error:", e)
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

@csrf_exempt
def ap_aging_report(request):
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
        entity_id = data.get("entity_id")
        if not entity_id:
            return JsonResponse({"status": "error", "message": "Missing entity_id"}, status=400)

        url = f"https://api.mercoa.com/entity/{entity_id}/invoices"  # ✅ GET not POST
        headers = make_headers()

        # ✅ Fix: change to GET instead of POST
        res = requests.get(url, headers=headers)
        res.raise_for_status()
        all_invoices = res.json().get("data", [])

        now = datetime.now(timezone.utc)
        aging_buckets = {
            "Current": [],
            "1-30 Days": [],
            "31-60 Days": [],
            "61-90 Days": [],
            "90+ Days": [],
        }
        
        statuses = data.get("statuses", ["APPROVED"])
        
        for invoice in all_invoices:
            if invoice.get("status") not in statuses:
                continue

            due_date_str = invoice.get("dueDate")
            if not due_date_str:
                continue

            due_date = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
            days_past_due = (now - due_date).days

            if days_past_due <= 0:
                aging_buckets["Current"].append(invoice)
            elif days_past_due <= 30:
                aging_buckets["1-30 Days"].append(invoice)
            elif days_past_due <= 60:
                aging_buckets["31-60 Days"].append(invoice)
            elif days_past_due <= 90:
                aging_buckets["61-90 Days"].append(invoice)
            else:
                aging_buckets["90+ Days"].append(invoice)

        return JsonResponse({
            "status": "success",
            "aging": aging_buckets
        })

    except requests.exceptions.RequestException as api_err:
        print("❌ Mercoa API Error:", api_err)
        return JsonResponse({
            "status": "error",
            "message": str(api_err)
        }, status=500)
    except Exception as e:
        print("❌ General error:", e)
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)
