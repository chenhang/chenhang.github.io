#-*- coding: utf8 -*-

from requests import get

import json


HEADERS = {
    'user-agent':
    ('Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'
     ),  # noqa: E501
    'Dnt': ('1'),
    'Accept-Encoding': ('gzip, deflate, sdch'),
    'Accept-Language': ('en'),
    'origin': ('http://stats.nba.com')
}


def live_match_api():
    return "https://api.overwatchleague.cn/live-match?expand=team.content&locale=zh-cn"


def schedule_api():
    return "https://api.overwatchleague.cn/schedule?expand=team.content&locale=zh_CN"


def teams_api():
    return "https://api.overwatchleague.cn/teams?expand=team.content&locale=zh-cn"


def standings_api():
    return "https://api.overwatchleague.cn/standings?expand=team.content&locale=zh_CN"


def maps_api():
    return "https://api.overwatchleague.cn/maps"


APIS = {'live_match': live_match_api(), 'schedule': schedule_api(),
        'teams': teams_api(), 'standings': standings_api(), 'maps': maps_api()}


def load_json(file_name):
    with open(file_name) as json_data:
        d = json.load(json_data)
        return d


def write_json(file_name, json_data):
    print('writting:' + file_name)
    with open(file_name, 'w') as outfile:
        json.dump(json_data, outfile)
        return json_data
    print('writting done:' + file_name)


if __name__ == '__main__':
    for name, api in APIS.items():
        res = get(api, headers=HEADERS, timeout=50).json()
        write_json('data/' + name + '.json', res)
