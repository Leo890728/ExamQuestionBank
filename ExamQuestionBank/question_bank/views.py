from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .services.pdf_parser import PDFParser


class ExtractExamPDFView(APIView):
    """
    將試卷 PDF 匯出為 json 並回傳
    """
    parser_classes = [MultiPartParser, FormParser]
    @swagger_auto_schema(
        operation_summary="上傳試卷 PDF 並轉換為 JSON",
        manual_parameters=[
            openapi.Parameter(
                name='file',
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description='試卷 PDF 檔案'
            )
        ],
        responses={200: "轉換成功"}
    )
    def post(self, request):
        pdf_file = request.FILES.get('file')
        if not pdf_file:
            return Response({"error": "請上傳 PDF 檔案"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            questions = PDFParser.parse_questions(pdf_file)
            return Response({
                "count": len(questions),
                "questions": questions,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExtractAnswerPDFView(APIView):
    """
    將試卷答案 PDF 匯出答案並回傳
    """
    parser_classes = [MultiPartParser, FormParser]
    @swagger_auto_schema(
        operation_summary="上傳答案 PDF 並轉換為 JSON",
        manual_parameters=[
            openapi.Parameter(
                name='file',
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description='試卷答案 PDF 檔案'
            )
        ],
        responses={200: "轉換成功"}
    )
    def post(self, request):
        pdf_file = request.FILES.get('file')
        if not pdf_file:
            return Response({"error": "請上傳 PDF 檔案"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            answers = PDFParser.parse_answers(pdf_file)
            return Response({
                "count": len(answers["answers"]),
                "notes": answers["notes"],
                "answers": answers["answers"],
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)