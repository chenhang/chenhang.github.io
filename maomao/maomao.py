#-*- coding: utf8 -*-

from requests import get
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
OODLE_BASE_URL = ""


def api(start=0):
    return "http://www.hoobly.com/12030/1940/" + str(start)+"/"


def oodle_api(start=0):
    return "https://cats.oodle.com/ragdoll/15206/?o=" + str(start) + "&r=250"


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
    return "http:" + origin.replace("/thumbs/", "/full/")


def to_str_date(origin):
    return datetime.datetime.strptime(origin, "%b %d %Y").date().strftime('%Y-%m-%d')


def get_oodle_maomaos():
    start = 0
    maomaos = []
    ids = []
    while(True):
        print(start)
        if start > 100:
            break
        res = get(api(start=start), headers=HEADERS, timeout=50)
        start += 15
        table = BeautifulSoup(res.content, "html.parser").find('table')
        trs = table.findAll('tr')
        for tr in trs:
            img_url = to_img_full_url(tr.find('img').attrs['src'])
            detail_url = BASE_URL + tr.find('a').attrs['href']
            desc, _, location, _, breed, _ = tr.find(
                'div').text.strip().split('\n\t\t\t\t\t\t\t')
            detail_res = get(detail_url, headers=HEADERS, timeout=50)
            soup = BeautifulSoup(detail_res.content, "html.parser")
            detail_table, info_table, _ = soup.findAll('table')
            img_tr, content_tr = detail_table.findAll("tr") if len(
                detail_table.findAll("tr")) == 2 else [[]] + detail_table.findAll("tr")
            info = [td.text.strip() for td in info_table.findAll("td")]
            info_dict = dict(zip(info[0::2], info[1::2]))
            posted = to_str_date(info_dict['Posted'])
            print(desc)
            img_urls = [to_img_full_url(img.attrs['src'])
                        for img in img_tr.findAll('img')]
            id = detail_url.split('/')[3]
            if id in ids:
                break
            ids.append(id)
            maomaos.append({'id': detail_url.split('/')[3], 'title': tr.find('img').attrs['alt'],
                            "desc": desc, 'location': location,
                            'posted': to_str_date(info_dict['Posted']), 'updated': to_str_date(info_dict['Updated']),
                            'breed': breed, 'price': tr.find('span').text, 'content': content_tr.text.strip(),
                            'main_img_url': img_url, 'detail_url': detail_url, 'img_urls': img_urls})
            time.sleep(2)
        write_json("data/maomaos.json", maomaos)
        leancloud_objects = [leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos]
        leancloud.Object.save_all([leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos])


def get_maomaos():
    start = 0
    maomaos = []
    ids = []
    while(True):
        print(start)
        if start > 20:
            break
        res = get(api(start=start), headers=HEADERS,
                  timeout=50, allow_redirects=False)
        start += 10
        table = BeautifulSoup(res.content, "html.parser").find('table')
        trs = table.findAll('tr')
        for tr in trs:
            img_url = to_img_full_url(tr.find('img').attrs['src'])
            detail_url = BASE_URL + tr.find('a').attrs['href']
            desc, _, location, _, breed, _ = tr.find(
                'div').text.strip().split('\n\t\t\t\t\t\t\t')
            detail_res = get(detail_url, headers=HEADERS,
                             timeout=50, allow_redirects=False)
            soup = BeautifulSoup(detail_res.content, "html.parser")
            detail_table, info_table, _ = soup.findAll('table')
            img_tr, content_tr = detail_table.findAll("tr") if len(
                detail_table.findAll("tr")) == 2 else [[]] + detail_table.findAll("tr")
            info = [td.text.strip() for td in info_table.findAll("td")]
            info_dict = dict(zip(info[0::2], info[1::2]))
            posted = to_str_date(info_dict['Posted'])
            print(desc)
            img_urls = [to_img_full_url(img.attrs['src'])
                        for img in img_tr.findAll('img')]
            id = detail_url.split('/')[3]
            if id in ids:
                break
            ids.append(id)
            maomaos.append({'id': detail_url.split('/')[3], 'title': tr.find('img').attrs['alt'],
                            "desc": desc, 'location': location,
                            'posted': to_str_date(info_dict['Posted']), 'updated': to_str_date(info_dict['Updated']),
                            'breed': breed, 'price': tr.find('span').text, 'content': content_tr.text.strip(),
                            'main_img_url': img_url, 'detail_url': detail_url, 'img_urls': img_urls})
            time.sleep(2)
        write_json("data/maomaos.json", maomaos)
        leancloud_objects = [leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos]
        leancloud.Object.save_all([leancloud_object(
            "Maomao", maomao, id_key="id") for maomao in maomaos])


if __name__ == '__main__':
    get_maomaos()
