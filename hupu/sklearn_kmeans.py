# -*- coding: UTF-8 -*-
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

import numpy as np
from numpy import array
import matplotlib.pyplot as plt
import json
import csv
import os
from sklearn.metrics import silhouette_score
from sklearn.cluster import KMeans
from scipy.spatial.distance import cdist

HEADERS = [
    "Post-Up", "P&R Ball Handler", "Isolation", "Transition", "Offscreen",
    "Handoff", "Spot-Up", "P&R Roll Man", "Cut", "Putbacks"
]

# DATA_PATH = 'play_types.data'
DATA_PATH = '../csv/league_data.csv'
PATH = 'cluster_img'


def load_data():
    f = open(DATA_PATH)
    features = []
    names = []
    for line in f:
        words = line.rstrip().split(',')
        # Store player names
        names.append(words[0])
        # Store features of each player
        features.append([float(i) for i in words[1:]])

    f.close()
    return (array(features), names)


data, names = load_data()


def show_result_elbow(data):
    X = data

    K = range(1, 20)
    meandistortions = []
    for k in K:
        kmeans = KMeans(n_clusters=k)
        kmeans.fit(X)
        # 求kmeans的成本函数值
        meandistortions.append(
            sum(
                np.min(cdist(X, kmeans.cluster_centers_, 'euclidean'), axis=1))
            / X.shape[0])

    plt.figure()
    plt.grid(True)
    plt1 = plt.subplot(2, 1, 1)
    plt1.plot(X[:, 0], X[:, 1], 'k.')
    plt2 = plt.subplot(2, 1, 2)

    plt2.plot(K, meandistortions, 'bx-')
    plt.show()


def show_result_score(data):
    Ks = range(1, 80)
    km = [KMeans(n_clusters=i) for i in Ks]
    score = [km[i].fit(data).score(data) for i in range(len(km))]
    plt.plot(Ks, score)
    plt.show()


def show_result_sc(data):

    X = data

    for n_cluster in range(2, 80):
        kmeans = KMeans(n_clusters=n_cluster).fit(X)
        label = kmeans.labels_
        sil_coeff = silhouette_score(X, label, metric='euclidean')
        print("For n_clusters={}, The Silhouette Coefficient is {}".format(
            n_cluster, sil_coeff))


# show_result(data)
show_result_sc(data)
# get_images(16, data)
# team_cluster()
