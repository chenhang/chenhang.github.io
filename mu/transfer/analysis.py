#-*- encoding:utf-8 -*-

import json
import re
import operator
from collections import Counter
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.book import FreqDist
import string
import pandas as pd


def load_json(file_name):
    with open(file_name) as json_data:
        d = json.load(json_data)
        return d


def write_json(file_name, json_data):
    print 'writting:' + file_name
    with open(file_name, 'w') as outfile:
        json.dump(json_data, outfile)
        return json_data
    print 'writting done:' + file_name


def cleanupDoc(s):
    stopset = set(stopwords.words('english') +
                  list(string.punctuation) + ['http', 'https'])
    tokens = word_tokenize(s)
    cleanup = [token.lower() for token in tokens if token.lower()
               not in stopset and len(token) > 2]
    return cleanup


# data = load_json('summer_transfer.json')['tweets']
data = load_json('transfer.json')['tweets']
langs = []

text = '\n'.join([(d['text']) for d in data.values()])

fdist = FreqDist(cleanupDoc(text))
freq = pd.DataFrame(dict(fdist), index=['freq']).T
freq.sort_values('freq', ascending=False, inplace=True)
# freq.to_csv('freq_winter')
print(freq.head(100))
