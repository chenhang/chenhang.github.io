#-*- coding: utf8 -*-

from requests import get
import os
import leancloud
import json
import logging
import config
import datetime

logging.basicConfig(level=logging.DEBUG)

leancloud.init(config.leancloud_app_id, config.leancloud_app_key)

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


def data_file_name(name):
    return 'data/' + name + '.json'


def update_data():
    for name, api in APIS.items():
        res = get(api, headers=HEADERS, timeout=50).json()
        write_json(data_file_name(name), res)


def leancloud_object(name, data, id_key='id'):
    DataObject = leancloud.Object.extend(name)
    query = DataObject.query
    query.equal_to(id_key, data[id_key])
    try:
        data_object = query.first()
    except BaseException as e:
        print(str(e))
        data_object = DataObject()
    for key, value in data.items():
        data_object.set(key, value)
    return data_object


def upload_data():
    teams = load_json(data_file_name('teams'))
    # KEYS
    # ['owl_divisions', 'description', 'availableLanguages',
    # 'game', 'strings', 'competitors', 'logo', 'id', 'name']
    league = {'id': teams['id'], 'name': teams['name'],
              'description': teams['description'], 'logo': teams['logo']}
    divisions = teams['owl_divisions']
    division_mapping = {division['id']: division for division in divisions}

    # ['secondaryPhoto', 'addressCountry', 'handle',
    # 'name', 'logo', 'type', 'availableLanguages',
    # 'abbreviatedName', 'attributesVersion',
    # 'players', 'game', 'content', 'accounts',
    # 'primaryColor', 'owl_division', 'secondaryColor',
    # 'attributes', 'homeLocation', 'id', 'icon']
    competitors_keys = ['secondaryPhoto', 'addressCountry', 'handle',
                        'name', 'logo', 'abbreviatedName',
                        'game', 'content', 'accounts', 'players',
                        'primaryColor', 'owl_division',
                        'secondaryColor', 'attributes',
                        'homeLocation', 'id', 'icon']
    competitors = []
    for item in teams['competitors']:
        competitor = {key: item['competitor'][key] for key in competitors_keys}
        competitor['owl_division_info'] = division_mapping[str(
            competitor['owl_division'])]
        competitors.append(competitor)

    standings = load_json(data_file_name('standings'))
    ranks = standings['ranks']
    stages, matches = parse_schedule()
    object_data = {'League': {'data': [league], 'id_key': 'id'},
                   'Division': {'data': divisions, 'id_key': 'id'},
                   'Competitor': {'data': competitors, 'id_key': 'id'},
                   'Rank': {'data': ranks, 'id_key': 'placement'},
                   'Stage': {'data': stages, 'id_key': 'id'},
                   'Match': {'data': matches, 'id_key': 'id'}}

    for name, info in object_data.items():
        data_objects = []

        for item in info['data']:
            data_objects.append(leancloud_object(name, item, info['id_key']))
        leancloud.Object.save_all(data_objects)


def parse_schedule():
    schedule = load_json(data_file_name('schedule'))
    season_start_date = schedule['data']['startDate']
    season_end_date = schedule['data']['endDate']
    # ['id', 'enabled', 'name', 'tournaments', 'matches']
    stages = []
    matches = []
    current_year_no, current_week_no, current_week_day = datetime.date.today().isocalendar()
    for stage_info in schedule['data']['stages']:
        stage = stage_info
        stage_matches = []
        # ['id', 'competitors', 'scores',
        # 'round', 'ordinal', 'winnersNextMatch',
        # 'winnerRound', 'winnerOrdinal', 'bestOf',
        # 'conclusionValue', 'conclusionStrategy',
        # 'winner', 'state', 'attributes', 'games',
        # 'clientHints', 'dateCreated', 'flags',
        # 'handle', 'startDate', 'endDate',
        # 'showStartTime', 'showEndTime',
        # 'startDateTS', 'endDateTS', 'youtubeId',
        # 'wins', 'ties', 'losses', 'videos', 'tournament']
        for match_info in stage_info['matches']:
            match = {'stageId': stage_info['id'],
                     'stageName': stage_info['name']}
            # print(match_info)
            if match_info['startDateTS']:
                year_no, week_no, week_day = datetime.datetime.fromtimestamp(
                    match_info['startDateTS'] / 1000).isocalendar()
                match['week_no'] = current_week_no - \
                    week_no + (current_year_no - year_no) * 52
            for key, value in match_info.items():
                match[key] = value
            matches.append(match)
            stage_matches.append(match)
        stage['matches'] = stage_matches
        stages.append(stage)
    return stages, matches


if __name__ == '__main__':
    update_data()
    upload_data()
