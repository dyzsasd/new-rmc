import mongoengine

from rmc.settings import mongodb_settings
from course import Course  # @UnusedImport
from department import Department  # @UnusedImport
from exam import Exam  # @UnusedImport
from points import PointSource  # @UnusedImport
from user_schedule_item import UserScheduleItem  # @UnusedImport
from user_schedule_item import FailedScheduleItem  # @UnusedImport
from professor import Professor  # @UnusedImport
from promotion_code import PromotionCode
from rating import AggregateRating  # @UnusedImport
from review import ProfessorReview  # @UnusedImport
from review import CourseReview  # @UnusedImport
from term import Term  # @UnusedImport
from user import User  # @UnusedImport
from user_course import UserCourse  # @UnusedImport
from section import SectionMeeting  # @UnusedImport
from section import Section  # @UnusedImport
from course_alert import BaseCourseAlert  # @UnusedImport
from course_alert import GcmCourseAlert  # @UnusedImport
from scholarship import Scholarship  # @UnusedImport
from review import SimpleReview
from comment import CourseComment
from comment import CourseProfessorComment


mongoengine.connect(
    db=mongodb_settings['db'],
    username=mongodb_settings['user'],
    password=mongodb_settings['password'],
    host=mongodb_settings['host'],
    port=mongodb_settings['port'],
)
