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

MERCOA_API_KEY = "4956c7d4b2944b8aa656a2ae8b604732"
MERCOA_API_URL = "https://api.mercoa.com/entity"
UPLOAD_DIR = "uploads/"
User = get_user_model()

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
        headers = {
            "Authorization": f"Bearer {MERCOA_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "entityId": data["entityId"],         # Sender
            "payeeId": data["payeeId"],           # Recipient
            "memo": data.get("memo", ""),
            "dueDate": data.get("dueDate"),
            "lineItems": data["lineItems"],       # List of line items
        }

        res = requests.post("https://api.mercoa.com/invoice", headers=headers, json=payload)
        res.raise_for_status()
        invoice = res.json()

        return JsonResponse({"status": "success", "invoice": invoice})

    except requests.exceptions.RequestException as e:
        return JsonResponse({"status": "error", "message": "Mercoa API error", "details": str(e)}, status=500)

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
