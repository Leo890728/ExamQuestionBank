from django.urls import path
from .views import ExtractExamPDFView, ExtractAnswerPDFView

urlpatterns = [
    path("extract-questions-pdf/", ExtractExamPDFView.as_view(), name="extract-questions_pdf"),
    path("extract-answers-pdf/", ExtractAnswerPDFView.as_view(), name="extract-answers_pdf"),
]