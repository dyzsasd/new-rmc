db.course.update({}, {$unset : {"overall": ""}}, {multi: true});
db.course.update({}, {$unset : {"interest": ""}}, {multi: true});
db.course.update({}, {$unset : {"usefulness": ""}}, {multi: true});
db.course.update({}, {$unset : {"easiness": ""}}, {multi: true});