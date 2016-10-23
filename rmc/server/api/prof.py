import flask
import rmc.common.util as util
import rmc.models as m
import rmc.server.view_helpers as view_helpers


api = flask.Blueprint('prof_api', __name__, url_prefix='/api/prof')


@api.route('/<string:prof_id>', methods=['GET'])
def get_prof(prof_id):
    prof_id = prof_id.lower()
    prof = m.Professor.objects(id=prof_id).first()

    if prof is None:
        return flask.abort(404)
    else:
        return util.json_dumps(prof.to_dict())


@api.route('/collection/', methods=['GET'])
def get_profs():
    prof_ids = flask.request.args.getlist('prof_id')
    profs = [
        prof.to_dict()
        for prof in m.Professor.objects(id__in=prof_ids)
    ]
    return util.json_dumps(profs)

