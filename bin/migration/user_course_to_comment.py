import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../../')

from rmc.models.user_course import UserCourse
from rmc.models.comment import CourseComment
from rmc.models.comment import CourseProfessorComment


for user_course in UserCourse.objects:
    course_review = user_course.course_review
    professor_review = user_course.professor_review

    course_comment = CourseComment(
        user_id=user_course.user_id,
        course_id=user_course.course_id
    )

    if course_review.comment:
        course_comment.text = course_review.comment
    if course_review.comment_date:
        course_comment.created_at = course_review.comment_date
        course_comment.last_updated_at = course_review.comment_date
    if course_review.share_date:
        course_comment.shared_at = course_review.share_date
    if course_review.rating_change_date:
        course_comment.rating_updated_at = course_review.rating_change_date
    if course_review.privacy:
        course_comment.privacy = course_review.privacy
    if course_review.num_voted_helpful:
        course_comment.num_voted_helpful = course_review.num_voted_helpful
    if course_review.num_voted_not_helpful:
        course_comment.num_voted_not_helpful = course_review.num_voted_not_helpful
    if course_review.interest:
        course_comment.interest = course_review.interest
    if course_review.easiness:
        course_comment.easiness = course_review.easiness
    if course_review.usefulness:
        course_comment.usefulness = course_review.usefulness

    if course_comment.non_empty():
        course_comment.save()


    if user_course.professor_id and professor_review:
        course_professor_comment = CourseProfessorComment(
            user_id=user_course.user_id,
            course_id=user_course.course_id,
            professor_id=user_course.professor_id
        )

        if professor_review.comment:
            course_professor_comment.text = professor_review.comment
        if professor_review.comment_date:
            course_professor_comment.created_at = professor_review.comment_date
            course_professor_comment.last_updated_at = professor_review.comment_date
        if professor_review.share_date:
            course_professor_comment.shared_at = professor_review.share_date
        if professor_review.rating_change_date:
            course_professor_comment.rating_updated_at = professor_review.rating_change_date
        if professor_review.privacy:
            course_professor_comment.privacy = professor_review.privacy
        if professor_review.num_voted_helpful:
            course_professor_comment.num_voted_helpful = professor_review.num_voted_helpful
        if professor_review.num_voted_not_helpful:
            course_professor_comment.num_voted_not_helpful = professor_review.num_voted_not_helpful
        if professor_review.clarity:
            course_professor_comment.clarity = professor_review.clarity
        if professor_review.passion:
            course_professor_comment.passion = professor_review.passion

        if course_professor_comment.non_empty():
            course_professor_comment.save()


