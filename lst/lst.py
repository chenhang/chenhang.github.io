import requests
from urllib.parse import urlencode
import json
from config import url

def load_json(file_name, default=dict):
    if os.path.exists(file_name):
        with open(file_name) as json_data:
            d = json.load(json_data)
            return d
    else:
        return default()


def write_json(file_name, json_data):
    print('writing:' + file_name)
    with open(file_name, 'w') as outfile:
        json.dump(json_data, outfile, ensure_ascii=False)
        print('writing done:' + file_name)
        return True


d = requests.get(url).json()

r = []

for dd in d['data']:
    if dd['type'] == 'PromoteCard':
        path = 'pages/base?{0}'.format(urlencode({'api': dd['detail']['api']}))
        r.append([dd['subTitle'], dd['title'], path])
        print(dd['subTitle'], dd['title'], path)


write_json('lst.json', r)
