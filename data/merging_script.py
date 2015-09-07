# -*- coding: utf-8 -*-
"""
Created on Fri Aug 14 13:10:14 2015

@author: Niklas Bendixen

I am part of that power which eternally wills evil and eternally works good.
"""

import fnmatch  # https://docs.python.org/2/library/fnmatch.html
import glob     # https://docs.python.org/2/library/glob.html
import os       # https://docs.python.org/2/library/os.html
import re       # https://docs.python.org/2/library/re.html
import shutil   # https://docs.python.org/2/library/shutil.html
import time     # https://docs.python.org/2/library/time.html


# Get the actual datetime as a string in the format YYYYMMDD-HHMM
timestr = time.strftime('%Y%m%d-%H%M')

# Rename an existing file 'merged_json.json' to 'merged_json_YYYYMMDD-HHMM.json'
if os.path.isfile('merged_json.json'):
    shutil.copyfile('merged_json.json', timestr + '_merged_json.json')
# Delete existing file 'merged_json.json'
    os.remove('merged_json.json')


# Open the three results-json-files and merge them as 'merged_json.json'
# Not with glob.glob due to the need of this particular order of the files
read_files = []
read_files.append('persons_query_results.json')
read_files.append('documents_query_results.json')
read_files.append('keywords_query_results.json')
with open('merged_json.json', 'wb') as outfile:
    outfile.write('[{}]'.format(
    ','.join([open(f, 'rb').read() for f in read_files])))


# Delete the three results-json-files
remove_files = glob.glob('*_query_results.json')
for remove_file in remove_files:
    os.remove(remove_file)
#os.remove('documents_query_results.json')
#os.remove('persons_query_results.json')
#os.remove('keywords_query_results.json')


# Get the actual datetime
now = time.time()
# 7 Days * 86400 Seconds (= 1 Day) = 1 Week
cutoff = now - (7 * 86400)

# Delete files older than a week
old_files = glob.glob('*merged_json.json')
for old_file in old_files:
        if os.path.isfile('' + old_file):
                t = os.stat('' + old_file)
                c = t.st_ctime
                if c < cutoff:
                        os.remove(old_file)