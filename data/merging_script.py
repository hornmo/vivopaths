# -*- coding: utf-8 -*-
"""
Created on Fri Aug 14 13:10:14 2015

@author: Niklas Bendixen

I am part of that power which eternally wills evil and eternally works good.
"""

import glob
import os
import shutil
import sys
import time
from subprocess import call

# Gets the actual datetime
now = time.time()
cutoff = now - (7 * 86400)

# Deletes file older than a week
old_files = os.listdir('')
for old_file in old_files:
        if os.path.isfile('' + old_file):
                t = os.stat('' + old_file)
                c = t.st_ctime
                if c < cutoff:
                        os.remove('' + old_file)

# Gets the actual datetime as a string in the format YYYYMMDD-HHMM
timestr = time.strftime('%Y%m%d-%H%M')

# Renames an existing 'merged_json.json' file to 'merged_json_YYYYMMDD-HHMM.json'
shutil.copyfile('merged_json.json', timestr + '_merged_json.json')

# Deletes existing 'merged_json.json' file
os.remove('merged_json.json')

# Opens the two result-json-files and merges them as merged_json.json
read_files = glob.glob('*_query_results.json')
with open('merged_json.json', 'wb') as outfile:
    outfile.write('[{}]'.format(
    ','.join([open(f, 'rb').read() for f in read_files])))


# Deletes the two results-json-files
os.remove(glob('*_query_results.json'))
#os.remove('documents_query_results.json')
#os.remove('persons_query_results.json')