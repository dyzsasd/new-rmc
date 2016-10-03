import flask

import rmc.models as m
import rmc.server.view_helpers as view_helpers


api = flask.Blueprint('schedule_api', __name__, url_prefix='/api/schedule')


@api.route('/', methods=['POST'])
@view_helpers.login_required
def upload_schedule():
    req = flask.request
    user = view_helpers.get_current_user()

    schedule_data = util.json_loads(req.form.get('schedule_data'))
    courses = schedule_data['courses']
    failed_courses = schedule_data['failed_courses']
    term_name = schedule_data['term_name']
    term_id = m.Term.id_from_name(term_name)

    rmclogger.log_event(
        rmclogger.LOG_CATEGORY_API,
        rmclogger.LOG_EVENT_SCHEDULE, {
            'schedule_data': schedule_data,
            'term_id': term_id,
            'user_id': user.id,
        },
    )

    now = datetime.now()

    user.last_good_schedule_paste = req.form.get('schedule_text')
    user.last_good_schedule_paste_date = now
    user.save()

    # Remove existing schedule items for the user for the given term
    for usi in m.UserScheduleItem.objects(user_id=user.id, term_id=term_id):
        usi.delete()

    for course in courses:
        # Add this item to the user's course history
        # FIXME(Sandy): See if we can get program_year_id from Quest
        # Or just increment their last one
        user.add_course(course['course_id'], term_id)

        for item in course['items']:
            try:
                # Create this UserScheduleItem
                first_name, last_name = m.Professor.guess_names(
                        item['prof_name'])
                prof_id = m.Professor.get_id_from_name(
                    first_name=first_name,
                    last_name=last_name,
                )
                if first_name and last_name:
                    if not m.Professor.objects.with_id(prof_id):
                        m.Professor(
                            id=prof_id,
                            first_name=first_name,
                            last_name=last_name,
                        ).save()

                usi = m.UserScheduleItem(
                    user_id=user.id,
                    class_num=item['class_num'],
                    building=item['building'],
                    room=item.get('room'),
                    section_type=item['section_type'].upper(),
                    section_num=item['section_num'],
                    start_date=datetime.utcfromtimestamp(item['start_date']),
                    end_date=datetime.utcfromtimestamp(item['end_date']),
                    course_id=course['course_id'],
                    prof_id=prof_id,
                    term_id=term_id,
                )
                try:
                    usi.save()
                except me.NotUniqueError as ex:
                    # Likely the case where the user pastes in two or more
                    # valid schedules into the same input box
                    logging.info(
                            'Duplicate error on UserScheduleItem .save(): %s'
                            % (ex))

            except KeyError:
                logging.error("Invalid item in uploaded schedule: %s" % (item))

    # Add courses that failed to fully parse, probably due to unavailable times
    for course_id in set(failed_courses):
        fsi = m.FailedScheduleItem(
            user_id=user.id,
            course_id=course_id,
            parsed_date=now,
        )

        try:
            fsi.save()
        except me.NotUniqueError as ex:
            # This should never happen since we're iterating over a set
            logging.warn('WTF this should never happen.')
            logging.warn('Duplicate error FailedScheduleItem.save(): %s' % ex)

        user.add_course(course_id, term_id)

    user.schedules_imported += 1
    user.save()

    schedule_screenshot.update_screenshot_async(user)

    rmclogger.log_event(
        rmclogger.LOG_CATEGORY_SCHEDULE,
        rmclogger.LOG_EVENT_UPLOAD,
        user.id
    )

    return ''


def get_schedule_dir():
    return os.path.join(app.config['LOG_DIR'], 'schedules')


@api.route('/screenshot_url', methods=['GET'])
@view_helpers.login_required
def schedule_screenshot_url():
    user = view_helpers.get_current_user()

    return util.json_dumps({
        # Note that this may be None
        "url": schedule_screenshot.get_screenshot_url(user)
    })


@api.route('/log', methods=['POST'])
@view_helpers.login_required
def schedule_log():
    user = view_helpers.get_current_user()

    file_name = '%d.txt' % int(time.time())
    file_path = os.path.join(get_schedule_dir(), file_name)
    with open(file_path, 'w') as f:
        f.write(flask.request.form['schedule'].encode('utf-8'))

    rmclogger.log_event(
        rmclogger.LOG_CATEGORY_SCHEDULE,
        rmclogger.LOG_EVENT_PARSE_FAILED, {
            'user_id': user.id,
            'file_path': file_path,
        },
    )

    user.last_bad_schedule_paste = flask.request.form.get('schedule')
    user.last_bad_schedule_paste_date = datetime.now()
    user.save()

    return ''
