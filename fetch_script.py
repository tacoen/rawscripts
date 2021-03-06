from Crypto.Cipher import AES
import requests
import base64
import json
import time
import sys
import zlib
from datetime import datetime

from flask.ext.script import Manager
from flask.ext.migrate import Migrate, MigrateCommand

from rawscripts import app, db
from flask_models import *

manager = Manager(app)


URL = 'http://www.rawscripts.com/fetchdb'
START_TIME = None
PASSWORD = None
IV = None
MAX_LIMIT = 500
LIMITS = [MAX_LIMIT, 100, 75, 50, 25]

def _fetch(params):
    r = requests.get(URL, params=params)
    text = r.text
    if text.startswith('Missing'):
        raise Exception(text)
    ciphertext = base64.b64decode(r.text)
    obj = AES.new(PASSWORD, AES.MODE_CBC, IV)
    compressed = obj.decrypt(ciphertext)
    compressed =  compressed[compressed.index('@') + 1:]
    return zlib.decompress(compressed)

def fetch(params):
    for limit in LIMITS:
        try:
            params['limit'] = limit
            data = _fetch(params)
            if limit != MAX_LIMIT:
                print 'Limit worked:', limit
            return data
        except:
            pass
    raise Exception('WTF? Oh, no limits worked')

def commit_users(data, session):
    last_time = None
    users = json.loads(data)
    for u in users:
        u[1] = datetime.strptime(u[1], "%Y-%m-%d %H:%M:%S.%f")
        au = AppengineUser(*u)
        email, firstUse = u[0], u[1]
        user = User(name=email, firstUse=firstUse, username=email, active=True,
                    email=email, confirmed_at=firstUse)
        user.appengine_user = au
        session.add(user)
        session.add(au)
        last_time = firstUse
    session.commit()
    return last_time

def commit_notes(data, session):
    last_time = None
    notes = json.loads(data)
    for resource_id, thread_id, updated, data, row, col in notes:
        updated = datetime.strptime(updated, "%Y-%m-%d %H:%M:%S.%f")
        note = session.query(Note).filter_by(thread_id=thread_id).first()
        if note:
            note.data = data
            note.updated = updated
            note.row = row
            note.col = col
        else:
            note = Note(resource_id=resource_id, thread_id=thread_id, data=data,
                        updated=updated, row=row, col=col)
        session.add(note)
        last_time = updated
    session.commit()
    return last_time

def commit_unread_notes(data, session):
    last_time = None
    unread_notes = json.loads(data)
    for resource_id, thread_id, msg_id, user, timestamp in unread_notes:
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        unread_note = UnreadNote(resource_id=resource_id, thread_id=thread_id,
                                 msg_id=msg_id, user=user, timestamp=timestamp)
        session.add(unread_note)
        last_time = timestamp
    session.commit()
    return last_time

def commit_share_notify(data, session):
    last_time = None
    fields = ['user', 'resource_id', 'timeshared', 'timeopened', 'opened']
    timestamp_fields = ['timeshared', 'timeopened']
    last_time_field = 'timeshared'
    obj_model = ShareNotify
    lines = json.loads(data)
    for line in lines:
        kwargs = dict((fields[i], line[i]) for i in range(len(fields)))
        for field in timestamp_fields:
            kwargs[field] = datetime.strptime(kwargs[field], "%Y-%m-%d %H:%M:%S.%f")
        obj = obj_model(**kwargs)
        session.add(obj)
        last_time = kwargs[last_time_field]
    session.commit()
    return last_time


def commit_open_id_data2(data, session):
    last_time = None
    for line in data.split('\n'):
        if len(line) == 0:
            continue
        nickname, email, user_id, federated_identity, federated_provider, timestamp = line.split(',')
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        open_id = OpenIDData2(nickname=nickname,
                              email=email,
                              user_id=user_id,
                              federated_identity=federated_identity,
                              federated_provider=federated_provider,
                              timestamp=timestamp)
        session.add(open_id)
        last_time = timestamp
    session.commit()
    return last_time

def commit_script_data(data, session):
    last_time = None
    lines = json.loads(data)
    ids = {}
    for resource_id, script_data, version, timestamp, autosave, export, tag in lines:
        version = int(version)
        if len(timestamp) == 19:
            # one row in whole database is missing milliseconds...
            timestamp += ".000000"
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        autosave = bool(int(autosave))
        obj = ScriptData(resource_id=resource_id,
                         data=script_data,
                         version=version,
                         timestamp=timestamp,
                         autosave=autosave,
                         export=export,
                         tag=tag)
        session.add(obj)
        last_time = timestamp
        ids[resource_id] = True

    session.commit()
    return last_time

def commit_users_scripts(data, session):
    last_time = None
    lines = json.loads(data)
    for user, resource_id, title, timestamp, permission, folder in lines:
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        row = session.query(UsersScripts).filter_by(resource_id=resource_id). \
                  filter_by(user=user, permission=permission).first()
        if row:
            row.last_updated = timestamp
        else:
            obj = UsersScripts(user=user,
                               resource_id=resource_id,
                               title=title,
                               last_updated=timestamp,
                               permission=permission,
                               folder=folder)
            session.add(obj)
        last_time = timestamp
    session.commit()
    return last_time

def commit_blog(data, session):
    last_time = None
    lines = json.loads(data)
    for data, title, timestamp in lines:
        if len(timestamp) == 19:
            timestamp += ".000000"
        timestamp = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S.%f")
        obj = Blog(data=data, title=title, timestamp=timestamp)
        obj.path = obj.get_path_from_title()
        session.add(obj)
        last_time = timestamp
    session.commit()
    return last_time

def fetch_all_users():
    fetch_by_timestamps('Users', User, 'firstUse', commit_users)

def fetch_all_notes():
    fetch_by_timestamps('Notes', Note, 'updated', commit_notes, USERS_PER_REQUEST=100)

def fetch_all_unread_notes():
    fetch_by_timestamps('UnreadNotes', UnreadNote, 'timestamp',
                        commit_unread_notes, USERS_PER_REQUEST=100)

def fetch_all_share_notify():
    fetch_by_timestamps('ShareNotify', ShareNotify, 'timeshared',
                        commit_share_notify, USERS_PER_REQUEST=100)

def fetch_all_openid2():
    fetch_by_timestamps('OpenID2', OpenIDData2, 'timestamp',
                        commit_open_id_data2)

def fetch_all_users_scripts():
    fetch_by_timestamps('UsersScripts', UsersScripts, 'last_updated',
                        commit_users_scripts, USERS_PER_REQUEST=500)

def fetch_all_blog_posts():
    fetch_by_timestamps('BlogDB', Blog, 'timestamp',
                        commit_blog)

def fetch_all_duplicate_scripts():
    print "Fetching DuplicateScripts"
    params = {'table': 'DuplicateScripts'}
    data = fetch(params)
    for line in data.split('\n'):
        if line == '':
            continue
        __key__, from_script, new_script, from_version = line.split(',')
        from_version = int(from_version)
        exists = db.session.query(DuplicateScript). \
                     filter_by(new_script=new_script).first()
        if exists:
            continue
        dup = DuplicateScript(from_script=from_script,
                              new_script=new_script,
                              from_version=from_version,
                              __key__=__key__)
        db.session.add(dup)
    db.session.commit()


def fetch_all_folders():
    print "Fetching folders"
    params = {'table': 'Folders'}
    data = fetch(params)
    lines = json.loads(data)
    for  __key__, user, data in lines:
        obj = db.session.query(Folder). \
                     filter_by(user=user).first()
        if not obj:
            obj = Folder(user=user, data=data, __key__=__key__)
            db.session.add(obj)
        obj.data = data
    db.session.commit()


def fetch_all_title_page_data():
    print "Fetching Title Pages"
    params = {'table': 'TitlePageData'}
    data = fetch(params)
    rows = json.loads(data)
    for row in rows:
        obj = TitlePageData.get_by_resource_id(row['resource_id'])
        if obj:
            for key, val in row.items():
                setattr(obj, key, val)
        else:
            obj = TitlePageData(**row)
            db.session.add(obj)
    db.session.commit()

def fetch_all_script_data():
    fetch_by_timestamps('ScriptData', ScriptData, 'timestamp',
                        commit_script_data, USERS_PER_REQUEST=50)

def fetch_by_timestamps(table, model, timestamp_field, parsing_func, USERS_PER_REQUEST=40):
    global START_TIME
    session = db.session
    all_found = False
    while not all_found:
        if START_TIME is None:
            start = "2000-01-01T01:00:00.000000"
            timestamp = getattr(model, timestamp_field)
            last_user = session.query(model).order_by(db.desc(timestamp)).first()
            if last_user is not None:
                start = getattr(last_user, timestamp_field).isoformat()
            START_TIME = start
        print "Fetching", table, "starting from:", START_TIME
        params = {'table': table,
                  'start_time': START_TIME,
                  'limit': USERS_PER_REQUEST
        }
        data = fetch(params)
        if len(data) == 0:
            break
        last_time = parsing_func(data, session)
        if last_time is None:
            break
        START_TIME = last_time.isoformat()
    print "Completed fetching", table


@manager.command
def fetch_all(password, iv):
    global PASSWORD
    global IV
    global START_TIME
    PASSWORD = password
    IV = iv
    START_TIME = None
    fetch_all_script_data()
    START_TIME = None
    fetch_all_share_notify()
    START_TIME = None
    fetch_all_unread_notes()
    START_TIME = None
    fetch_all_notes()
    START_TIME = None
    fetch_all_users()
    START_TIME = None
    fetch_all_openid2()
    START_TIME = None
    fetch_all_users_scripts()
    START_TIME = None
    fetch_all_duplicate_scripts()
    START_TIME = None
    fetch_all_folders()
    START_TIME = None
    fetch_all_blog_posts()
    fetch_all_title_page_data()

if __name__ == "__main__":
    manager.run()
