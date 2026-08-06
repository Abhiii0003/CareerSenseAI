from django.http import JsonResponse

def home(request):
    return JsonResponse({
        "project": "CareerSenseAI",
        "version": "1.0.0",
        "status": "Backend Running 🚀"
    })