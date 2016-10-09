#!/usr/bin/env python

import sys
import os
from fumblr import app
from fumblr.database import db

if __name__ == '__main__':
    if '--setup' in sys.argv:
        with app.app_context():
            db.create_all()
            db.session.commit()
            print('Database tables created')
    else:
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        app.run()