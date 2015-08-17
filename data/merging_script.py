# -*- coding: utf-8 -*-
"""
Created on Fri Aug 14 13:10:14 2015

@author: Niklas Bendixen
"""

import glob

read_files = glob.glob('*.json')
with open('merged_json.json', 'wb') as outfile:
    outfile.write('[{}]'.format(
    ','.join([open(f, 'rb').read() for f in read_files])))