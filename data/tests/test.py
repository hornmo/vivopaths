# -*- coding: utf-8 -*-
"""
Created on Fri Aug 14 13:10:14 2015

@author: Niklas Bendixen

I am part of that power which eternally wills evil and eternally works good.
"""

'''
Tasks:
- Restructuring of query_results.json Files
'''
# # # # WORKS # # # #

## Remove first 6 lines and last 4 lines
#with open('persons_query_results.json', 'r') as read:
#    data = read.read().splitlines(True)
#with open('persons_query_results2.json', 'w') as write:
#    write.writelines(data[6:-3])

# # # # WORKS # # # #

# Siehe BAThesis auf GitHub wegen der Replacements == Loeschen



import fnmatch  # https://docs.python.org/2/library/fnmatch.html
import re       # https://docs.python.org/2/library/re.html       






######## TEST AREA ########

#with open('persons_query_results2.json', 'rb') as f:
#    for line in f:
#        newline = line.replace('type', 'XXXXXXX')
##        print newline
#        
#with open('persons_query_results3.json', 'wb') as w:
#    w.writelines(newline)