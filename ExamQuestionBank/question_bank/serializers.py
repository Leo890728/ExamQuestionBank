from rest_framework import serializers
from .models import (
    QuestionSet, Question, QuestionOption, QuestionTag, QuestionTagRelation,
    QuestionAttempt, QuestionNote, QuestionBookmark, PracticeSession, ImportJob
)
from exams.models import ExamSession, Subject


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_label', 'content', 'is_correct', 'order']
        read_only_fields = ['id']


class QuestionTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionTag
        fields = ['id', 'name', 'category', 'description']
        read_only_fields = ['id', 'created_at']


class QuestionListSerializer(serializers.ModelSerializer):
    """簡化版Question序列化器，用於列表顯示"""
    exam_session_name = serializers.CharField(source='exam_session.__str__', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    accuracy_rate = serializers.ReadOnlyField()

    class Meta:
        model = Question
        fields = [
            'id', 'question_number', 'content', 'question_type', 'difficulty',
            'points', 'status', 'exam_session_name', 'subject_name',
            'view_count', 'attempt_count', 'accuracy_rate', 'created_at'
        ]


class QuestionDetailSerializer(serializers.ModelSerializer):
    """完整Question序列化器，包含選項、標籤等"""
    options = QuestionOptionSerializer(many=True, read_only=True)
    tags = QuestionTagSerializer(source='tag_relations.tag', many=True, read_only=True)
    exam_session = serializers.StringRelatedField(read_only=True)
    subject = serializers.StringRelatedField(read_only=True)
    accuracy_rate = serializers.ReadOnlyField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'question_set', 'exam_session', 'subject', 'question_number',
            'content', 'question_type', 'difficulty', 'points', 'analysis',
            'answer_explanation', 'source_file', 'source_page', 'source_url',
            'status', 'is_public', 'view_count', 'attempt_count', 'correct_count',
            'accuracy_rate', 'version', 'options', 'tags', 'created_at',
            'updated_at', 'published_at', 'created_by_username'
        ]
        read_only_fields = ['id', 'view_count', 'attempt_count', 'correct_count', 'version']


class QuestionCreateUpdateSerializer(serializers.ModelSerializer):
    """用於創建和更新Question"""
    options = QuestionOptionSerializer(many=True, required=False)
    tag_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id', 'question_set', 'exam_session', 'subject', 'question_number',
            'content', 'question_type', 'difficulty', 'points', 'analysis',
            'answer_explanation', 'source_file', 'source_page', 'source_url',
            'status', 'is_public', 'options', 'tag_ids'
        ]

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['created_by'] = self.context['request'].user

        question = Question.objects.create(**validated_data)

        # Create options
        for option_data in options_data:
            QuestionOption.objects.create(question=question, **option_data)

        # Add tags
        for tag_id in tag_ids:
            QuestionTagRelation.objects.create(
                question=question,
                tag_id=tag_id,
                created_by=self.context['request'].user
            )

        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        tag_ids = validated_data.pop('tag_ids', None)
        validated_data['updated_by'] = self.context['request'].user
        validated_data['version'] = instance.version + 1

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update options if provided
        if options_data is not None:
            instance.options.all().delete()
            for option_data in options_data:
                QuestionOption.objects.create(question=instance, **option_data)

        # Update tags if provided
        if tag_ids is not None:
            instance.tag_relations.all().delete()
            for tag_id in tag_ids:
                QuestionTagRelation.objects.create(
                    question=instance,
                    tag_id=tag_id,
                    created_by=self.context['request'].user
                )

        return instance


class QuestionAttemptSerializer(serializers.ModelSerializer):
    question_detail = QuestionDetailSerializer(source='question', read_only=True)

    class Meta:
        model = QuestionAttempt
        fields = [
            'id', 'user', 'question', 'selected_options', 'answer_text',
            'is_correct', 'time_spent', 'practice_session', 'created_at',
            'question_detail'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class QuestionNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionNote
        fields = ['id', 'user', 'question', 'content', 'is_private', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class QuestionBookmarkSerializer(serializers.ModelSerializer):
    question_detail = QuestionListSerializer(source='question', read_only=True)

    class Meta:
        model = QuestionBookmark
        fields = ['id', 'user', 'question', 'created_at', 'question_detail']
        read_only_fields = ['id', 'user', 'created_at']


class PracticeSessionSerializer(serializers.ModelSerializer):
    accuracy_rate = serializers.ReadOnlyField()
    exam_session_name = serializers.CharField(source='exam_session.__str__', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = PracticeSession
        fields = [
            'id', 'user', 'mode', 'status', 'total_questions', 'answered_questions',
            'correct_answers', 'accuracy_rate', 'exam_session', 'exam_session_name',
            'subject', 'subject_name', 'difficulty', 'started_at', 'completed_at',
            'total_time_spent'
        ]
        read_only_fields = ['id', 'user', 'started_at']


class ImportJobSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = ImportJob
        fields = [
            'id', 'user', 'user_name', 'file_name', 'file_path', 'file_type',
            'status', 'total_items', 'processed_items', 'success_items',
            'failed_items', 'error_log', 'result_summary', 'created_at',
            'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'started_at', 'completed_at']
