#-*- coding: utf8 -*-

from requests import get, Session
from bs4 import BeautifulSoup
import os
import leancloud
import json
import logging
import config
import datetime
import time


logging.basicConfig(level=logging.DEBUG)

leancloud.init(config.leancloud_app_id, config.leancloud_app_key)

HEADERS = {
    'user-agent':
    ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0.3 Safari/604.5.6'
     ),  # noqa: E501
    'Dnt': ('1'),
    'Accept-Encoding': ('gzip, deflate, sdch'),
    'Accept-Language': ('zh-cn'),
    'origin': ('http://www.hoobly.com/12030/1940/0/')
}

BASE_URL = "http://www.hoobly.com"
OODLE_BASE_URL = "https://cats.oodle.com"


def api(start=0, location_id=12030):
    return "http://www.hoobly.com/" + str(location_id) + "/1940/" + str(start) + "/"


def oodle_api(start=0, r=250):
    return "https://cats.oodle.com/ragdoll/15206/?o=" + str(start) + "&r=" + str(r)


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


def to_img_full_url(origin):
    if 'images/no_pic.jpg' in origin:
        return 'https://ws1.sinaimg.cn/large/006tNc79gy1fovo1rjkghj305o05p40b.jpg'
    else:
        return "http:" + origin.replace("/thumbs/", "/full/")


def to_str_date(origin):
    return datetime.datetime.strptime(origin, "%b %d %Y").date().strftime('%Y-%m-%d')


def get_oodle_maomaos(r=250):
    start = 0
    maomaos = []
    ids = []
    while(True):
        print(start)
        if start > 44:
            break
        res = get(oodle_api(start=start, r=r),
                  headers=HEADERS, timeout=50)
        table = BeautifulSoup(res.content, "html.parser").find('ol')
        trs = table.findAll('li', {'class': 'has-thumbnail'})
        for i, tr in enumerate(trs):
            detail_url = OODLE_BASE_URL + \
                tr.find('a', {'class': 'title-link'}).attrs['href']
            detail_res = get(detail_url, headers=HEADERS, timeout=50)
            if detail_res.status_code == 301:
                continue
            detail_url = detail_res.url
            soup = BeautifulSoup(detail_res.content, "html.parser")
            content_div = soup.find('div', {'id': 'listing-detail-container'})
            keys = [div.text.strip().replace(':', '').lower()
                    for div in content_div.findAll('div', {'class': 'listing-attribute'})]
            values = [div.text.strip() for div in content_div.findAll(
                'div', {'class': 'listing-attribute-value'})]
            info_dict = dict(zip(keys, values))
            if 'reposted' in info_dict:
                info_dict['posted'] = info_dict['reposted']

            if content_div.find('div', {'id': 'photo-view'}):
                img_urls = [img.attrs['src'] for img in content_div.find(
                    'div', {'id': 'photo-view'}).findAll('img')]
            else:
                img_urls = [
                    'https://ws1.sinaimg.cn/large/006tNc79gy1fovo1rjkghj305o05p40b.jpg']
            print(info_dict['posted'])
            date_list = info_dict['posted'].split()[:3] if '20' in info_dict['posted'].split()[
                2] else info_dict['posted'].split()[:2] + ['2018']
            if len(date_list) < 3:
                date_list.append('2018')
            info_dict['posted'] = datetime.datetime.strptime(
                ' '.join(date_list), "%B %d %Y").date().strftime('%Y-%m-%d')

            print(info_dict['description'])
            id = '_'.join(['oodle', tr.attrs['id'].split('-')[-1]])
            if id in ids:
                break
            ids.append(id)
            maomao = {'id': id, 'title': tr.findAll('a')[1].text, 'order': i + start * 15,
                      'updated': info_dict['posted'], 'content': info_dict['description'],
                      'main_img_url': img_urls[0], 'detail_url': detail_url, 'img_urls': img_urls}
            for key, value in info_dict.items():
                new_key = 'desc' if key == 'description' else key
                maomao[new_key] = value
            maomao['is_bicolor'] = is_bi_color(
                maomao['desc'] + ' ' + maomao['title'])
            maomaos.append(maomao)
            time.sleep(2)
        write_json("data/oodle_maomaos.json", maomaos)
        leancloud_objects = [leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos]
        leancloud.Object.save_all([leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos])
        start += 15


def get_maomaos(location_id=12030):
    start = 0
    maomaos = []
    ids = []
    while(True):
        print(start)
        if start > 29:
            break
        sess = Session()
        res = sess.get(api(start=start, location_id=12030), headers=HEADERS,
                       timeout=50, allow_redirects=False)
        table = BeautifulSoup(res.content, "html.parser").find('table')
        trs = table.findAll('tr')
        for i, tr in enumerate(trs):
            img_url = to_img_full_url(tr.find('img').attrs['src'])
            detail_url = BASE_URL + tr.find('a').attrs['href']
            desc, _, location, _, breed, _ = tr.find(
                'div').text.strip().split('\n\t\t\t\t\t\t\t')
            detail_res = sess.get(
                detail_url, headers=HEADERS, timeout=50, allow_redirects=False)
            if detail_res.status_code == 301:
                continue
            soup = BeautifulSoup(detail_res.content, "html.parser")
            detail_table, info_table, _ = soup.findAll('table')
            img_tr, content_tr = detail_table.findAll("tr") if len(
                detail_table.findAll("tr")) == 2 else [[]] + detail_table.findAll("tr")
            info = [td.text.strip() for td in info_table.findAll("td")]
            info_dict = dict(zip(info[0::2], info[1::2]))
            posted = to_str_date(info_dict['Posted'])
            print(desc)
            img_urls = [to_img_full_url(img.attrs['src'])
                        for img in img_tr.findAll('img')] if not isinstance(img_tr, list) else ["https://ws1.sinaimg.cn/large/006tNc79gy1fovo1rjkghj305o05p40b.jpg"]
            id = detail_url.split('/')[3]
            if id in ids:
                break
            ids.append(id)
            maomaos.append({'id': detail_url.split('/')[3], 'title': tr.find('img').attrs['alt'],
                            "desc": desc, 'location': location, 'order': i + start * 15,
                            'posted': to_str_date(info_dict['Posted']), 'updated': to_str_date(info_dict['Updated']),
                            'breed': breed, 'price': tr.find('span').text, 'content': content_tr.text.strip(),
                            'main_img_url': img_url, 'detail_url': detail_url, 'img_urls': img_urls, 'is_bicolor': is_bi_color((desc + ' ' + tr.find('img').attrs['alt']).lower())})
            time.sleep(2)
        write_json("data/maomaos.json", maomaos)
        leancloud_objects = [leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos]
        leancloud.Object.save_all([leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos])
        start += 10


def is_bi_color(text):
    for string in ['bicolor', 'biocoloured', 'bicolour', 'bi-color', 'bi-colour']:
        if string in text:
            return True
    return False


if __name__ == '__main__':
    # get_maomaos(location_id=12030)
    # get_maomaos(location_id=184)
    # get_oodle_maomaos(r=250)
    get_oodle_maomaos(r='country')
